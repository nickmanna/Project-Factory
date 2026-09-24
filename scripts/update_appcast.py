#!/usr/bin/env python3
"""Insert a new release item into the Sparkle appcast.xml, creating it if absent."""
import argparse
import email.utils
import xml.etree.ElementTree as ET
from pathlib import Path

SPARKLE_NS = "http://www.andymatuschak.org/xml-namespaces/sparkle"
ET.register_namespace("sparkle", SPARKLE_NS)


def sparkle_tag(name: str) -> str:
    return f"{{{SPARKLE_NS}}}{name}"


def load_or_create_channel(appcast_path: Path, app_title: str) -> tuple[ET.ElementTree, ET.Element]:
    if appcast_path.exists():
        tree = ET.parse(appcast_path)
        channel = tree.getroot().find("channel")
        return tree, channel

    rss = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = app_title
    return ET.ElementTree(rss), channel


def build_item(args: argparse.Namespace) -> ET.Element:
    item = ET.Element("item")
    ET.SubElement(item, "title").text = f"Version {args.version}"
    ET.SubElement(item, "pubDate").text = email.utils.formatdate(localtime=True)
    ET.SubElement(item, "description").text = f"Release notes: {args.release_notes_url}"
    ET.SubElement(item, sparkle_tag("minimumSystemVersion")).text = args.min_system_version

    enclosure = ET.SubElement(item, "enclosure")
    enclosure.set("url", args.url)
    enclosure.set("length", str(args.length))
    enclosure.set("type", "application/octet-stream")
    enclosure.set(sparkle_tag("version"), args.build)
    enclosure.set(sparkle_tag("shortVersionString"), args.version)
    enclosure.set(sparkle_tag("edSignature"), args.signature)
    return item


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--appcast", required=True, type=Path)
    parser.add_argument("--app-title", default="Project Factory")
    parser.add_argument("--version", required=True, help="Marketing version, e.g. 1.2.3")
    parser.add_argument("--build", required=True, help="Monotonic build number, e.g. GitHub run number")
    parser.add_argument("--url", required=True, help="Download URL for the release zip")
    parser.add_argument("--length", required=True, type=int, help="Size of the release zip in bytes")
    parser.add_argument("--signature", required=True, help="EdDSA signature from sign_update")
    parser.add_argument("--min-system-version", default="14.0")
    parser.add_argument("--release-notes-url", required=True)
    args = parser.parse_args()

    tree, channel = load_or_create_channel(args.appcast, args.app_title)
    new_item = build_item(args)

    # Newest release first; existing items (if any) follow.
    existing_items = channel.findall("item")
    insert_index = list(channel).index(existing_items[0]) if existing_items else len(list(channel))
    channel.insert(insert_index, new_item)

    ET.indent(tree, space="    ")
    tree.write(args.appcast, encoding="UTF-8", xml_declaration=True)
    print(f"Added Version {args.version} (build {args.build}) to {args.appcast}")


if __name__ == "__main__":
    main()
