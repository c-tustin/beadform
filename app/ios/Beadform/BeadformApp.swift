import SwiftUI

@main
struct BeadformApp: App {
    @StateObject private var store = PatternStore()
    var body: some Scene {
        WindowGroup { StudioView().environmentObject(store).tint(.forest) }
    }
}

extension Color {
    static let forest = Color(red: 0.22, green: 0.35, blue: 0.27)
    static let paper = Color(red: 0.98, green: 0.97, blue: 0.94)
}
