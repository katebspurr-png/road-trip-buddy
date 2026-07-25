import AppIntents
import Foundation

/// Reads the trip state the web app mirrors into UserDefaults on every save.
enum RTBState {
    static func load() -> (trip: String, stops: [[String: Any]])? {
        guard let json = UserDefaults.standard.string(forKey: "rtb.state"),
              let data = json.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let stops = obj["stops"] as? [[String: Any]] else { return nil }
        return (obj["trip"] as? String ?? "your trip", stops)
    }

    static func nextStop() -> [String: Any]? {
        load()?.stops.first { !(($0["done"] as? Bool) ?? false) }
    }

    /// Mark the next stop done in the mirror (so a follow-up Siri query is
    /// accurate) and queue the name for the web app to apply on foreground.
    static func markNextArrived() -> String? {
        guard var (_, stops) = load().map({ ($0.trip, $0.stops) }),
              let idx = stops.firstIndex(where: { !(($0["done"] as? Bool) ?? false) }),
              let name = stops[idx]["name"] as? String,
              let json = UserDefaults.standard.string(forKey: "rtb.state"),
              let data = json.data(using: .utf8),
              var obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return nil }
        stops[idx]["done"] = true
        obj["stops"] = stops
        if let out = try? JSONSerialization.data(withJSONObject: obj),
           let outJson = String(data: out, encoding: .utf8) {
            UserDefaults.standard.set(outJson, forKey: "rtb.state")
        }
        var pending = UserDefaults.standard.stringArray(forKey: "rtb.pendingArrivals") ?? []
        pending.append(name)
        UserDefaults.standard.set(pending, forKey: "rtb.pendingArrivals")
        return name
    }
}

struct NextStopIntent: AppIntent {
    static var title: LocalizedStringResource = "What's My Next Stop"
    static var description = IntentDescription("Tells you the next stop on your road trip.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let stop = RTBState.nextStop(), let name = stop["name"] as? String else {
            return .result(dialog: "No stops left on your trip — you've arrived everywhere!")
        }
        let note = (stop["note"] as? String) ?? ""
        return .result(dialog: note.isEmpty
            ? "Your next stop is \(name)."
            : "Your next stop is \(name) — \(note).")
    }
}

struct MarkArrivedIntent: AppIntent {
    static var title: LocalizedStringResource = "Mark Arrived"
    static var description = IntentDescription("Checks off the next stop on your road trip.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let name = RTBState.markNextArrived() else {
            return .result(dialog: "There are no stops to check off.")
        }
        if let next = RTBState.nextStop(), let nextName = next["name"] as? String {
            return .result(dialog: "Checked off \(name). Next up: \(nextName).")
        }
        return .result(dialog: "Checked off \(name). That was the last stop — enjoy!")
    }
}

struct RTBAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: NextStopIntent(),
            phrases: [
                "What's my next stop in \(.applicationName)",
                "Next stop in \(.applicationName)",
                "Where am I going in \(.applicationName)",
            ],
            shortTitle: "Next Stop",
            systemImageName: "mappin.and.ellipse"
        )
        AppShortcut(
            intent: MarkArrivedIntent(),
            phrases: [
                "Mark arrived in \(.applicationName)",
                "I arrived in \(.applicationName)",
                "Check off this stop in \(.applicationName)",
            ],
            shortTitle: "Mark Arrived",
            systemImageName: "checkmark.circle"
        )
    }
}
