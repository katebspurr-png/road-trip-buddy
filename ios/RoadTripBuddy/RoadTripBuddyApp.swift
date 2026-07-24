import SwiftUI
import WebKit
import UIKit

@main
struct RoadTripBuddyApp: App {
    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()
        }
    }
}

struct WebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "share")
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
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
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
