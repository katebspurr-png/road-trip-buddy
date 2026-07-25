import SwiftUI
import WebKit
import UIKit

@main
struct RoadTripBuddyApp: App {
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active { WebViewStore.shared.applyPendingArrivals() }
        }
    }
}

/// Holds the live web view so Siri intents (which run outside the view tree)
/// can push queued "mark arrived" actions into the page when the app foregrounds.
final class WebViewStore {
    static let shared = WebViewStore()
    weak var webView: WKWebView?

    func applyPendingArrivals() {
        guard let webView,
              let pending = UserDefaults.standard.stringArray(forKey: "rtb.pendingArrivals"),
              !pending.isEmpty,
              let data = try? JSONSerialization.data(withJSONObject: pending),
              let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.rtbApplyArrivals && window.rtbApplyArrivals(\(json))")
        UserDefaults.standard.removeObject(forKey: "rtb.pendingArrivals")
    }
}

struct WebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "share")
        controller.add(context.coordinator, name: "keepAwake")
        controller.add(context.coordinator, name: "stateSync")
        // Route navigator.share (settle-up summary, backup file) to the native share sheet.
        let shareShim = """
        navigator.share = async (data) => {
          let payload = { text: (data && data.text) || "" };
          if (data && data.files && data.files.length) {
            payload = { name: data.files[0].name, text: await data.files[0].text() };
          }
          window.webkit.messageHandlers.share.postMessage(payload);
        };
        navigator.canShare = () => true;
        """
        controller.addUserScript(WKUserScript(source: shareShim, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let config = WKWebViewConfiguration()
        config.userContentController = controller

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        WebViewStore.shared.webView = webView
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        // Apply any Siri actions that queued while the app was closed.
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            WebViewStore.shared.applyPendingArrivals()
        }

        // The app itself runs from file:// — any http(s) link (map ↗) belongs in the system browser.
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url { UIApplication.shared.open(url) }
            return nil
        }

        // Without these, confirm()/alert() silently return false and backup import can never proceed.
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
            present(alert)
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            present(alert)
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            // Driver mode asks the OS not to sleep the screen while the phone is mounted.
            if message.name == "keepAwake" {
                UIApplication.shared.isIdleTimerDisabled = (message.body as? Bool) ?? false
                return
            }
            // The web app mirrors its trip state here so Siri intents can read it.
            if message.name == "stateSync" {
                if let json = message.body as? String {
                    UserDefaults.standard.set(json, forKey: "rtb.state")
                }
                return
            }
            guard message.name == "share",
                  let body = message.body as? [String: Any],
                  let text = body["text"] as? String else { return }
            var items: [Any] = [text]
            if let name = body["name"] as? String {
                let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(name)
                if (try? text.write(to: fileURL, atomically: true, encoding: .utf8)) != nil {
                    items = [fileURL]
                }
            }
            present(UIActivityViewController(activityItems: items, applicationActivities: nil))
        }

        private func present(_ vc: UIViewController) {
            guard let scene = UIApplication.shared.connectedScenes
                    .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
                  var top = scene.keyWindow?.rootViewController else { return }
            while let presented = top.presentedViewController { top = presented }
            top.present(vc, animated: true)
        }
    }
}
