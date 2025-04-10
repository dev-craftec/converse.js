import { __ } from 'i18n';
import { html } from "lit";
import { openRoomViaEvent, removeBookmarkViaEvent } from '../../utils.js';

export default (bm) => {
    const jid = bm.get('jid');
    const info_remove_bookmark = __('Unbookmark this groupchat');
    const open_title = __('Click to open this groupchat');
    return html`
        <div class="list-item room-item available-chatroom d-flex flex-row" data-room-jid="${jid}">
            <a class="list-item-link open-room w-100" data-room-jid="${jid}"
                title="${open_title}"
                @click=${openRoomViaEvent}>${bm.getDisplayName()}</a>

            <a class="list-item-action remove-bookmark align-self-center ${ bm.get('bookmarked') ? 'button-on' : '' }"
                tabindex="0"
                data-room-jid="${jid}"
                data-bookmark-name="${bm.getDisplayName()}"
                title="${info_remove_bookmark}"
                @click=${removeBookmarkViaEvent}>
            <converse-icon class="fa fa-times" size="1em"></converse-icon>
            </a>
        </div>
    `;
}
