import SwiftUI
import UIKit
import UniformTypeIdentifiers

struct StudioView: View {
    @EnvironmentObject var store: PatternStore
    @StateObject private var model = LocalModel()
    @Environment(\.scenePhase) private var scenePhase
    @State private var width = 6
    @State private var rows = 4
    @State private var prompt = "A small brick-stitch triangle"
    @State private var tab = 0
    @State private var active: BeadPattern?
    @State private var importKind: LocalModel.Asset = .model
    @State private var importing = false

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack {
                Form {
                    Section {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Make something\nbead by bead.").font(.system(.largeTitle, design: .serif)).foregroundStyle(Color.forest)
                            Text("An offline studio for your iPhone.").foregroundStyle(.secondary)
                            Label("iPhone app draft", systemImage: "iphone")
                        }.padding(.vertical, 8)
                    }
                    Section("Your design") {
                        TextField("Describe a flat pattern", text: $prompt, axis: .vertical).lineLimit(3...6)
                        Text("First version: small, flat stitch samples. Photo interpretation and 3D need separate on-device validation.").font(.footnote).foregroundStyle(.secondary)
                        Stepper("Starter width: \(width)", value: $width, in: 2...12)
                        Stepper("Rows: \(rows)", value: $rows, in: 1...12)
                        Text("Use an even starter width for peyote. RAW dimensions count units; ladder uses one row.").font(.footnote).foregroundStyle(.secondary)
                        Button("Generate on this iPhone") {
                            model.generate(prompt: prompt, width: width, rows: rows) { active = $0 }
                        }.disabled(!model.ready || model.working)
                        if model.working { ProgressView(); Button("Cancel and unload") { model.unload() } }
                        Text(model.message).font(.footnote).accessibilityAddTraits(.updatesFrequently)
                    }
                    Section("Explore the draft") {
                        Button { active = .triangle() } label: { Label("Open 18-bead sample", systemImage: "circle.hexagongrid") }
                        Text("The sample uses a computed brick pattern; no AI inference is simulated.").font(.footnote).foregroundStyle(.secondary)
                    }
                    Section("Your local model") {
                        Label(model.ready ? "Qwen loaded on this iPhone" : "Qwen is not loaded", systemImage: "cpu")
                        Button("Set up model files") { tab = 2 }
                    }
                }.navigationTitle("beadform ✦").scrollContentBackground(.hidden).background(Color.paper)
            }.tabItem { Label("Create", systemImage: "sparkles") }.tag(0)
            NavigationStack {
                List {
                    if store.patterns.isEmpty { Text("Save a sample to begin your collection.").foregroundStyle(.secondary) }
                    ForEach(store.patterns) { pattern in
                        Button { active = pattern } label: {
                            VStack(alignment: .leading) { Text(pattern.title); Text("\(pattern.beadCount) beads · saved on this iPhone").font(.caption).foregroundStyle(.secondary) }
                        }
                    }
                    if let message = store.storageMessage { Text(message).font(.footnote) }
                }.navigationTitle("My patterns")
            }.tabItem { Label("Patterns", systemImage: "square.grid.2x2") }.tag(1)
            NavigationStack {
                Form {
                    Section("Offline model setup") {
                        Text("Import Qwen3-VL-2B Q8_0 and the matching Beadform adapter using Files. SHA-256 checks verify both files. Text generation does not need the vision projector.")
                        ForEach(LocalModel.Asset.allCases) { asset in
                            Button { importKind = asset; importing = true } label: {
                                Label(asset.rawValue, systemImage: model.installed.contains(asset) ? "checkmark.circle" : "plus.circle")
                            }.disabled(model.working)
                        }
                        Toggle("Use CPU only", isOn: $model.cpuOnly).disabled(model.working || model.ready)
                        Button("Load Qwen on this iPhone") { model.load() }
                            .disabled(model.working || model.ready || model.installed.count != LocalModel.Asset.allCases.count)
                        if model.working { ProgressView() }
                        Button(model.working ? "Cancel and unload" : "Unload model") { model.unload() }
                            .disabled(!model.working && !model.ready)
                        Text(model.message).font(.footnote)
                    }
                    Section("Before generation") {
                        Text("Designed for iPhone 14 Pro and newer with iOS 17 or later. Actual memory use and speed still need device testing. If loading fails, close other apps or try CPU only. Keep the app open during generation.")
                        Text("After setup, generation must work in airplane mode. No computer connection or cloud fallback is part of this design.")
                    }
                }.navigationTitle("On this iPhone")
            }.tabItem { Label("Model", systemImage: "cpu") }.tag(2)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .background { model.unload() }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.didReceiveMemoryWarningNotification)) { _ in model.unload() }
        .sheet(item: $active) { pattern in NavigationStack { PatternView(pattern: pattern).environmentObject(store) } }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.data]) { result in
            switch result {
            case .success(let url): model.importAsset(importKind, from: url)
            case .failure(let error): model.message = error.localizedDescription
            }
        }
    }
}

struct PatternView: View {
    let pattern: BeadPattern
    @EnvironmentObject var store: PatternStore
    @Environment(\.dismiss) private var dismiss
    @State private var step = 0
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text(pattern.source == "on-device-qwen" ? "ON-DEVICE QWEN · \(pattern.technique?.uppercased() ?? "FLAT")" : "BUILT-IN SAMPLE · BRICK STITCH").font(.caption).foregroundStyle(.secondary)
                Text(pattern.title).font(.system(.largeTitle, design: .serif))
                HStack { Label("\(pattern.beadCount) beads", systemImage: "circle.grid.3x3"); Spacer(); Text("\(pattern.steps.count) steps") }
                if let positions = pattern.beadPositions {
                    BeadLayout(positions: positions).frame(height: 300)
                } else {
                    VStack(spacing: 8) {
                        ForEach(pattern.rows.indices, id: \.self) { row in
                            HStack(spacing: 5) {
                                ForEach(pattern.rows[row], id: \.self) { bead in
                                    Ellipse().fill(row <= step ? Color.forest : Color.forest.opacity(0.18))
                                        .frame(width: 32, height: 24).accessibilityLabel("Bead \(bead)")
                                }
                            }
                        }
                    }.frame(maxWidth: .infinity).padding(.vertical)
                }
                Text("Layout only. Follow the written movements for thread order.").font(.footnote).foregroundStyle(.secondary)
                HStack {
                    Button { step -= 1 } label: { Image(systemName: "chevron.left").frame(minWidth: 44, minHeight: 44) }.disabled(step == 0).accessibilityLabel("Previous step")
                    Spacer(); Text("Step \(step+1) of \(pattern.steps.count)"); Spacer()
                    Button { step += 1 } label: { Image(systemName: "chevron.right").frame(minWidth: 44, minHeight: 44) }.disabled(step == pattern.steps.count-1).accessibilityLabel("Next step")
                }
                Text(pattern.steps[step]).lineSpacing(9).frame(maxWidth: .infinity, alignment: .leading)
                Text("11/0 round seed beads · 0.20 mm thread. Starting, finishing, tension and strength need physical testing; this draft does not certify buildability.").font(.footnote).foregroundStyle(.secondary)
                Button { store.save(pattern) } label: { Label("Save on this iPhone", systemImage: "square.and.arrow.down").frame(maxWidth: .infinity, minHeight: 44) }.buttonStyle(.borderedProminent)
                if let message = store.storageMessage { Text(message).font(.footnote) }
            }.padding()
        }.background(Color.paper).navigationTitle("Pattern guide").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
    }
}

private struct BeadLayout: View {
    let positions: [BeadPosition]
    var body: some View {
        Canvas { context, size in
            let xs = positions.map(\.x), ys = positions.map(\.y)
            let minX = xs.min() ?? 0, minY = ys.min() ?? 0
            let dx = (xs.max() ?? 0) - minX, dy = (ys.max() ?? 0) - minY
            let scale = min((size.width - 40) / max(dx + 2, 2), (size.height - 40) / max(dy + 2, 2))
            for bead in positions {
                let point = CGPoint(x: (bead.x - minX - dx / 2) * scale + size.width / 2,
                                    y: (bead.y - minY - dy / 2) * scale + size.height / 2)
                let rect = CGRect(x: point.x - scale * 0.6, y: point.y - scale * 0.65, width: scale * 1.2, height: scale * 1.3)
                context.fill(Path(ellipseIn: rect), with: .color(.forest.opacity(0.7)))
                context.draw(Text(bead.id).font(.system(size: max(6, min(10, scale * 0.4)))).foregroundColor(.primary), at: CGPoint(x: point.x, y: point.y + scale))
            }
        }.accessibilityLabel("Computed bead layout, \(positions.count) beads. Use the written steps for bead identifiers and thread order.")
    }
}
