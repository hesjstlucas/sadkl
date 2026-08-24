/**
 * ─── Custom Emoji Config ───────────────────────────────────────────────────
 * All IDs sourced from the Vyron Development server.
 */

export const E = {
  ticket:  '<:1ticket:1541183193720553642>',
  gavel:   '<:1gavel:1541183281331052714>',
  up:      '<:1up:1541183380815609897>',
  line:    '<:1line:1541183606511370380>',
  member:  '<:1member:1541183656520060928>',
  dash:    '<:1dash:1541183751240028230>',
  members: '<:1members:1541184095172960428>',
  shield:  '<:1shield:1541184287972401194>',
  kick:    '<:1kick:1541184379206770768>',
  loading: '<a:loading:1541184636342763640>',
  stats:   '<:stats:1541184659755507842>',
  home:    '<:1home:1541184771105759292>',

  // Aliases
  get check()   { return this.up; },
  get down()    { return this.kick; },
  get network() { return this.home; },
};

/**
 * Parses a custom emoji string into the object Discord's button API needs.
 * Handles both static  <:name:id>  and animated  <a:name:id>
 *
 * @param {string} emojiStr  e.g. '<:1ticket:1541183193720553642>'
 * @returns {{ id: string, name: string, animated: boolean }}
 */
export function eid(emojiStr) {
  const match = emojiStr.match(/^<(a?):([^:]+):(\d+)>$/);
  if (!match) throw new Error(`Invalid emoji string: ${emojiStr}`);
  return { animated: match[1] === 'a', name: match[2], id: match[3] };
}
