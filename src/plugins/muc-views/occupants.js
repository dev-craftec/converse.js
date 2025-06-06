import debounce from 'lodash-es/debounce.js';
import { _converse, api, u, RosterFilter } from "@converse/headless";
import { CustomElement } from 'shared/components/element.js';
import tplMUCOccupants from "./templates/muc-occupants.js";
import 'shared/autocomplete/index.js';
import './modals/muc-invite.js';
import './occupant.js';

import 'shared/styles/status.scss';
import './styles/muc-occupants.scss';

const { initStorage } = u;

export default class MUCOccupants extends CustomElement {

    constructor () {
        super();
        this.jid = null;
    }

    static get properties () {
        return {
            jid: { type: String }
        }
    }

    initialize() {
        const filter_id = `_converse.occupants-filter-${this.jid}`;
        this.filter = new RosterFilter();
        this.filter.id = filter_id;
        initStorage(this.filter, filter_id);
        this.filter.fetch();

        const { chatboxes } = _converse.state;
        this.model = chatboxes.get(this.jid);

        // To avoid rendering continuously the participant list in case of massive joins/leaves:
        const debouncedRequestUpdate = debounce(() => this.requestUpdate(), 200, {
            maxWait: 1000
        });

        this.listenTo(this.model, 'change', () => this.requestUpdate());
        this.listenTo(this.model.occupants, 'add', debouncedRequestUpdate);
        this.listenTo(this.model.occupants, 'change', debouncedRequestUpdate);
        this.listenTo(this.model.occupants, 'remove', debouncedRequestUpdate);
        this.listenTo(this.model.occupants, 'sort', debouncedRequestUpdate);
        this.listenTo(this.model.features, 'change:open', () => this.requestUpdate());

        this.model.initialized.then(() => this.requestUpdate());
    }

    render () {
        return tplMUCOccupants(this);
    }

    /**
     * @param {MouseEvent} ev
     */
    showInviteModal (ev) {
        ev.preventDefault();
        api.modal.show('converse-muc-invite-modal', { muc: this.model }, ev);
    }

    /** @param {MouseEvent} ev */
    toggleFilter (ev) {
        ev?.preventDefault?.();
        u.safeSave(this.model, { 'filter_visible': !this.model.get('filter_visible') });
    }

    /** @param {MouseEvent} ev */
    closeSidebar (ev) {
        ev?.preventDefault?.();
        u.safeSave(this.model, { 'hidden_occupants': true });
    }
}

api.elements.define('converse-muc-occupants', MUCOccupants);
