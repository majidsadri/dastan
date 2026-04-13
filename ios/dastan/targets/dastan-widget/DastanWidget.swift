//
//  DastanWidget.swift
//  Dastan — Today widget
//
//  A home-screen widget showing today's daily canvas painting from
//  https://www.mydastan.com. On each timeline refresh (~every 6h,
//  subject to iOS widget budget), the provider fetches
//  /api/canvas/today, parses the painting object, and renders a
//  full-bleed cover with an italic caption drawer at the bottom —
//  the same editorial vocabulary the rest of the app uses.
//
//  No shared data, no App Group: the widget is a standalone
//  consumer of the public backend, so it works identically to the
//  app without any extra IPC plumbing.
//

import WidgetKit
import SwiftUI

// MARK: - Entry

struct DastanEntry: TimelineEntry {
    let date: Date
    let title: String
    let artist: String
    let year: String
    let movement: String
    let imageURL: URL?
}

// MARK: - Timeline provider

struct DastanProvider: TimelineProvider {
    static let placeholder = DastanEntry(
        date: Date(),
        title: "Today's canvas",
        artist: "Dastan",
        year: "",
        movement: "",
        imageURL: nil
    )

    func placeholder(in context: Context) -> DastanEntry {
        Self.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (DastanEntry) -> Void) {
        fetchToday { entry in
            completion(entry ?? Self.placeholder)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DastanEntry>) -> Void) {
        fetchToday { entry in
            let now = Date()
            let nextRefresh = Calendar.current.date(byAdding: .hour, value: 6, to: now)
                ?? now.addingTimeInterval(6 * 3600)
            let timeline = Timeline(
                entries: [entry ?? Self.placeholder],
                policy: .after(nextRefresh)
            )
            completion(timeline)
        }
    }

    // MARK: Network

    private func fetchToday(completion: @escaping (DastanEntry?) -> Void) {
        guard let url = URL(string: "https://www.mydastan.com/api/canvas/today") else {
            completion(nil)
            return
        }
        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        URLSession.shared.dataTask(with: request) { data, _, _ in
            guard
                let data = data,
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let canvas = json["canvas"] as? [String: Any],
                let painting = canvas["painting"] as? [String: Any]
            else {
                completion(nil)
                return
            }
            let title = (painting["title"] as? String) ?? "—"
            let rawArtist = (painting["artist"] as? String) ?? ""
            // Backend sometimes returns "Artist unknown\nChinese" —
            // keep only the first line for the widget's tight layout.
            let artist = rawArtist.split(separator: "\n").first.map(String.init) ?? rawArtist
            let year = (painting["year"] as? String) ?? ""
            let movement = (painting["movement"] as? String) ?? ""
            let path = (painting["image_url"] as? String) ?? ""
            let imageURL = URL(string: "https://www.mydastan.com" + path)
            let entry = DastanEntry(
                date: Date(),
                title: title,
                artist: artist,
                year: year,
                movement: movement,
                imageURL: imageURL
            )
            completion(entry)
        }.resume()
    }
}

// MARK: - View

struct DastanWidgetEntryView: View {
    var entry: DastanEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Full-bleed painting
            if let url = entry.imageURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        Color("$widgetBackground")
                    }
                }
            } else {
                Color("$widgetBackground")
            }

            // Bottom scrim fading to near-black so the caption stays
            // legible over busy brushwork.
            LinearGradient(
                colors: [
                    Color.black.opacity(0),
                    Color.black.opacity(0.35),
                    Color.black.opacity(0.88),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: scrimHeight)
            .frame(maxWidth: .infinity, alignment: .bottom)

            // Caption drawer
            VStack(alignment: .leading, spacing: 2) {
                if !entry.movement.isEmpty && family != .systemSmall {
                    Text(entry.movement.uppercased())
                        .font(.system(size: 8, weight: .semibold))
                        .tracking(1.4)
                        .foregroundColor(Color("$accent"))
                        .lineLimit(1)
                }
                Text(entry.title)
                    .font(.system(size: titleSize, design: .serif).weight(.semibold))
                    .foregroundColor(.white)
                    .lineLimit(titleLines)
                    .minimumScaleFactor(0.85)
                Text(entry.artist + (entry.year.isEmpty ? "" : "  ·  \(entry.year)"))
                    .font(.system(size: metaSize, design: .serif).italic())
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(1)
            }
            .padding(EdgeInsets(top: 0, leading: 12, bottom: 12, trailing: 12))
        }
        .containerBackground(Color("$widgetBackground"), for: .widget)
    }

    private var scrimHeight: CGFloat {
        switch family {
        case .systemSmall: return 72
        case .systemMedium: return 90
        default: return 130
        }
    }

    private var titleSize: CGFloat {
        switch family {
        case .systemSmall: return 13
        case .systemMedium: return 16
        default: return 22
        }
    }

    private var titleLines: Int {
        family == .systemSmall ? 2 : 2
    }

    private var metaSize: CGFloat {
        family == .systemSmall ? 10 : 12
    }
}

// MARK: - Widget

struct DastanWidget: Widget {
    let kind: String = "DastanWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DastanProvider()) { entry in
            DastanWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Dastan — Today")
        .description("The daily canvas from mydastan.com on your home screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Bundle

@main
struct DastanWidgetBundle: WidgetBundle {
    var body: some Widget {
        DastanWidget()
    }
}
