export function isMobileViewport(): boolean;
/**
 * @param {import('@converse/headless/types/shared/chatbox').default} model
 */
export function getChatStyle(model: import("@converse/headless/types/shared/chatbox").default): string;
/**
 * @param {Model} model
 */
export function getUnreadMsgsDisplay(model: Model): any;
/**
 * @param {Promise<HeadingButtonAttributes>|HeadingButtonAttributes} promise_or_data
 * @returns {Promise<TemplateResult|''>}
 */
export function getHeadingDropdownItem(promise_or_data: Promise<HeadingButtonAttributes> | HeadingButtonAttributes): Promise<TemplateResult | "">;
/**
 * @param {Promise<HeadingButtonAttributes>|HeadingButtonAttributes} promise_or_data
 * @returns {Promise<TemplateResult>}
 */
export function getHeadingStandaloneButton(promise_or_data: Promise<HeadingButtonAttributes> | HeadingButtonAttributes): Promise<TemplateResult>;
/**
 * @param {Promise<Array<HeadingButtonAttributes>>} promise
 */
export function getStandaloneButtons(promise: Promise<Array<HeadingButtonAttributes>>): Promise<import("lit-html/directive.js").DirectiveResult<typeof import("lit-html/directives/until.js").UntilDirective>[]>;
/**
 * @param {Promise<Array<object>>} promise
 */
export function getDropdownButtons(promise: Promise<Array<object>>): Promise<import("lit-html").TemplateResult<1> | "">;
export function onScrolledDown(model: any): void;
/**
 * Given a message object, returns a TemplateResult indicating a new day if
 * the passed in message is more than a day later than its predecessor.
 * @param {Message} message
 * @returns {TemplateResult|undefined}
 */
export function getDayIndicator(message: Message): TemplateResult | undefined;
/**
 * @param {MUCMessage} message
 */
export function getHats(message: MUCMessage): any[];
export function getTonedEmojis(): any;
/**
 * @typedef {object} EmojiMarkupOptions
 * @property {boolean} [unicode_only=false]
 * @property {boolean} [add_title_wrapper=false]
 *
 * @param {object} data
 * @param {EmojiMarkupOptions} options
 */
export function getEmojiMarkup(data: object, options?: EmojiMarkupOptions): any;
/**
 * @param {string} text
 * @param {object} options
 */
export function addEmojisMarkup(text: string, options: object): string[];
/**
 * Returns an emoji represented by the passed in shortname.
 * Scans the passed in text for shortnames and replaces them with
 * emoji unicode glyphs or alternatively if it's a custom emoji
 * without unicode representation then a lit TemplateResult
 * which represents image tag markup is returned.
 *
 * The shortname needs to be defined in `emojis.json`
 * and needs to have either a `cp` attribute for the codepoint, or
 * an `url` attribute which points to the source for the image.
 *
 * @namespace u
 * @method u.shortnamesToEmojis
 * @param {String} str - String containg the shortname(s)
 * @param {Object} options
 * @param {Boolean} options.unicode_only - Whether emojis are rendered as
 *  unicode codepoints. If so, the returned result will be an array
 *  with containing one string, because the emojis themselves will
 *  also be strings. If set to false, emojis will be represented by
 *  lit TemplateResult objects.
 * @param {Boolean} options.add_title_wrapper - Whether unicode
 *  codepoints should be wrapped with a `<span>` element with a
 *  title, so that the shortname is shown upon hovering with the
 *  mouse.
 * @returns {Array} An array of at least one string, or otherwise
 * strings and lit TemplateResult objects.
 */
export function shortnamesToEmojis(str: string, options?: {
    unicode_only: boolean;
    add_title_wrapper: boolean;
}): any[];
export type EmojiMarkupOptions = {
    unicode_only?: boolean;
    add_title_wrapper?: boolean;
};
export type HeadingButtonAttributes = import("plugins/chatview/types").HeadingButtonAttributes;
export type Message = import("@converse/headless").Message;
export type MUCMessage = import("@converse/headless").MUCMessage;
export type Model = import("@converse/skeletor").Model;
export type TemplateResult = import("lit").TemplateResult;
//# sourceMappingURL=utils.d.ts.map