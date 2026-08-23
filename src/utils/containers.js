import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ThumbnailBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  SeparatorSpacingSize,
  ComponentType,
} from 'discord.js';

// ─── Accent colours ────────────────────────────────────────────────────────
export const Colors = {
  DEFAULT: 0x5865f2,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  DANGER:  0xed4245,
  INFO:    0x5865f2,
  MUTED:   0x4e5058,
};

// ─── Thin separator ────────────────────────────────────────────────────────
export function sep(divider = false) {
  return new SeparatorBuilder()
    .setDivider(divider)
    .setSpacing(SeparatorSpacingSize.Small);
}

export function thickSep() {
  return new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Large);
}

// ─── Plain text line ───────────────────────────────────────────────────────
export function text(content) {
  return new TextDisplayBuilder().setContent(content);
}

// ─── Build a full container with optional accent colour ───────────────────
export function buildContainer(components, accentColor = Colors.DEFAULT) {
  const c = new ContainerBuilder().setAccentColor(accentColor);
  for (const comp of components) c.addComponent(comp);
  return c;
}

// ─── Generic info row with label + value ──────────────────────────────────
export function infoRow(label, value) {
  return text(`**${label}** ${value ?? '—'}`);
}
