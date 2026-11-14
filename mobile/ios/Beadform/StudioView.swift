import SwiftUI
import UniformTypeIdentifiers

struct StudioView: View {
    @EnvironmentObject var store: PatternStore
    @StateObject private var model = LocalModel()
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
                        Button("Generate on this iPhone") {}.disabled(true)
                        Text("Generation becomes available after the native runtime is integrated and model loading succeeds.").font(.footnote).foregroundStyle(.secondary)
                    }
                    Section("Explore the draft") {
                        Button { active = .triangle() } label: { Label("Open 18-bead sample", systemImage: "circle.hexagongrid") }
                        Text("The sample uses a computed brick pattern; no AI inference is simulated.").font(.footnote).foregroundStyle(.secondary)
                    }
                    Section("Your local model") {
                        Label("Runtime not linked", systemImage: "externaldrive.badge.exclamationmark")
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
                        Text("Import the Qwen GGUF, its matching vision projector and the Beadform adapter using Files. They are copied into this app’s storage.")
                        ForEach(LocalModel.Asset.allCases) { asset in
                            Button { importKind = asset; importing = true } label: {
                                Label(asset.rawValue, systemImage: model.installed.contains(asset) ? "checkmark.circle" : "plus.circle")
                            }
                        }
                        Text(model.message).font(.footnote)
                    }
                    Section("Before generation") {
                        Text("Files present does not mean the model can run. This draft still needs a native runtime, model integrity checks, the shared compiler/checker, and real-iPhone memory and speed tests.")
                        Text("After setup, generation must work in airplane mode. No computer connection or cloud fallback is part of this design.")
                    }
                }.navigationTitle("On this iPhone")
            }.tabItem { Label("Model", systemImage: "cpu") }.tag(2)
        }
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
                Text("BUILT-IN SAMPLE · BRICK STITCH").font(.caption).foregroundStyle(.secondary)
                Text(pattern.title).font(.system(.largeTitle, design: .serif))
                HStack { Label("\(pattern.beadCount) beads", systemImage: "circle.grid.3x3"); Spacer(); Text("\(pattern.steps.count) steps") }
                VStack(spacing: 8) {
                    ForEach(pattern.rows.indices, id: \.self) { row in
                        HStack(spacing: 5) {
                            ForEach(pattern.rows[row], id: \.self) { bead in
                                VStack(spacing: 4) {
                                    Ellipse().fill(row <= step ? Color.forest : Color.forest.opacity(0.18)).frame(width: 32, height: 24)
                                        .overlay(Rectangle().fill(.white.opacity(0.8)).frame(width: 3, height: 18))
                                    Text(bead).font(.system(size: 9))
                                }.accessibilityLabel("Bead \(bead)")
                            }
                        }
                    }
                }.frame(maxWidth: .infinity).padding(.vertical).accessibilityLabel("Bead layout; highlighted through the current row")
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
