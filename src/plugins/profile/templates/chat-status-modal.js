import { html } from "lit";
import { __ } from 'i18n';

export default (el) => {
    const label_away = __('Away');
    const label_busy = __('Busy');
    const label_online = __('Online');
    const label_save = __('Save');
    const label_xa = __('Away for long');
    const status = el.model.get('status');

    return html`
    <form class="converse-form set-xmpp-status" id="set-xmpp-status" @submit=${ev => el.onFormSubmitted(ev)}>
        <div>
            <div class="custom-control custom-radio">
                <input ?checked=${status === 'online'}
                    type="radio" id="radio-online" value="online" name="chat_status" class="custom-control-input"/>
                <label class="custom-control-label" for="radio-online">
                    <converse-icon size="1em" class="fa fa-circle chat-status chat-status--online"></converse-icon>${label_online}</label>
            </div>
            <div class="custom-control custom-radio">
                <input ?checked=${status === 'busy'}
                    type="radio" id="radio-busy" value="dnd" name="chat_status" class="custom-control-input"/>
                <label class="custom-control-label" for="radio-busy">
                    <converse-icon size="1em" class="fa fa-minus-circle  chat-status chat-status--busy"></converse-icon>${label_busy}</label>
            </div>
            <div class="custom-control custom-radio">
                <input ?checked=${status === 'away'}
                    type="radio" id="radio-away" value="away" name="chat_status" class="custom-control-input"/>
                <label class="custom-control-label" for="radio-away">
                    <converse-icon size="1em" class="fa fa-circle chat-status chat-status--away"></converse-icon>${label_away}</label>
            </div>
            <div class="custom-control custom-radio">
                <input ?checked=${status === 'xa'}
                    type="radio" id="radio-xa" value="xa" name="chat_status" class="custom-control-input"/>
                <label class="custom-control-label" for="radio-xa">
                    <converse-icon size="1em" class="far fa-circle chat-status chat-status--xa"></converse-icon>${label_xa}</label>
            </div>
        </div>
        <button type="submit" class="btn btn-primary">${label_save}</button>
    </form>`;
}
