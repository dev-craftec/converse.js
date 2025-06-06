/**
 * @copyright The Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 * @description Implements the core logic for XEP-0045 Multi-User Chat
 */
import '../chat/index.js';
import '../disco/index.js';
import '../emoji/index.js';
import MUCMessage from './message.js';
import MUCMessages from './messages.js';
import MUC from './muc.js';
import MUCOccupant from './occupant.js';
import MUCOccupants from './occupants.js';
import affiliations_api from './affiliations/api.js';
import muc_api from './api.js';
import _converse from '../../shared/_converse.js';
import api from '../../shared/api/index.js';
import converse from '../../shared/api/public.js';
import { CHATROOMS_TYPE } from '../../shared/constants.js';
import {
    autoJoinRooms,
    disconnectChatRooms,
    getDefaultMUCNickname,
    isInfoVisible,
    onAddClientFeatures,
    onBeforeResourceBinding,
    onBeforeTearDown,
    onDirectMUCInvitation,
    onStatusInitialized,
    onWindowStateChanged,
    registerDirectInvitationHandler,
    routeToRoom,
} from './utils.js';
import { computeAffiliationsDelta } from './affiliations/utils.js';
import {
    AFFILIATION_CHANGES,
    AFFILIATION_CHANGES_LIST,
    INFO_CODES,
    MUC_NICK_CHANGED_CODE,
    MUC_ROLE_CHANGES,
    MUC_ROLE_CHANGES_LIST,
    MUC_TRAFFIC_STATES,
    MUC_TRAFFIC_STATES_LIST,
    ROOMSTATUS,
    ROOM_FEATURES,
} from './constants.js';

converse.AFFILIATION_CHANGES = AFFILIATION_CHANGES;
converse.AFFILIATION_CHANGES_LIST = AFFILIATION_CHANGES_LIST;
converse.MUC_TRAFFIC_STATES = MUC_TRAFFIC_STATES;
converse.MUC_TRAFFIC_STATES_LIST = MUC_TRAFFIC_STATES_LIST;
converse.MUC_ROLE_CHANGES = MUC_ROLE_CHANGES;
converse.MUC_ROLE_CHANGES_LIST = MUC_ROLE_CHANGES_LIST;

converse.MUC = { INFO_CODES };

converse.MUC_NICK_CHANGED_CODE = MUC_NICK_CHANGED_CODE;
converse.ROOM_FEATURES = ROOM_FEATURES;
converse.ROOMSTATUS = ROOMSTATUS;

const { Strophe } = converse.env;

// Add Strophe Namespaces
Strophe.addNamespace('MUC_ADMIN', Strophe.NS.MUC + '#admin');
Strophe.addNamespace('MUC_OWNER', Strophe.NS.MUC + '#owner');
Strophe.addNamespace('MUC_REGISTER', 'jabber:iq:register');
Strophe.addNamespace('MUC_ROOMCONF', Strophe.NS.MUC + '#roomconfig');
Strophe.addNamespace('MUC_USER', Strophe.NS.MUC + '#user');
Strophe.addNamespace('MUC_HATS', 'urn:xmpp:hats:0');
Strophe.addNamespace('CONFINFO', 'urn:ietf:params:xml:ns:conference-info');

converse.plugins.add('converse-muc', {
    dependencies: ['converse-chatboxes', 'converse-chat', 'converse-disco'],

    initialize () {
        /* The initialize function gets called as soon as the plugin is
         * loaded by converse.js's plugin machinery.
         */
        const { __, ___ } = _converse;

        // Configuration values for this plugin
        // ====================================
        // Refer to docs/source/configuration.rst for explanations of these
        // configuration settings.
        api.settings.extend({
            allow_muc_invitations: true,
            auto_join_on_invite: false,
            auto_join_rooms: [],
            auto_register_muc_nickname: true,
            colorize_username: false,
            hide_muc_participants: false,
            locked_muc_domain: false,
            modtools_disable_assign: false,
            muc_clear_messages_on_leave: true,
            muc_domain: undefined,
            muc_fetch_members: true,
            muc_history_max_stanzas: undefined,
            muc_instant_rooms: true,
            muc_nickname_from_jid: false,
            muc_send_probes: false,
            muc_show_info_messages: [
                ...converse.MUC.INFO_CODES.visibility_changes,
                ...converse.MUC.INFO_CODES.self,
                ...converse.MUC.INFO_CODES.non_privacy_changes,
                ...converse.MUC.INFO_CODES.muc_logging_changes,
                ...converse.MUC.INFO_CODES.nickname_changes,
                ...converse.MUC.INFO_CODES.disconnected,
                ...converse.MUC.INFO_CODES.affiliation_changes,
                ...converse.MUC.INFO_CODES.join_leave_events,
                ...converse.MUC.INFO_CODES.role_changes,
            ],
            muc_show_logs_before_join: false,
            muc_subscribe_to_rai: false,
        });
        api.promises.add(['roomsAutoJoined']);

        if (api.settings.get('locked_muc_domain') && typeof api.settings.get('muc_domain') !== 'string') {
            throw new Error(
                'Config Error: it makes no sense to set locked_muc_domain ' + 'to true when muc_domain is not set'
            );
        }

        // This is for tests (at least until we can import modules inside tests)
        converse.env.muc_utils = { computeAffiliationsDelta };
        Object.assign(api, muc_api);
        Object.assign(api.rooms, affiliations_api);

        /**
         * https://xmpp.org/extensions/xep-0045.html
         * -----------------------------------------
         */
        const STATUS_CODE_MESSAGES = {
            '100': __('This groupchat is not anonymous'),
            '102': __('This groupchat now shows unavailable members'),
            '103': __('This groupchat does not show unavailable members'),
            '104': __('The groupchat configuration has changed'),
            '170': __('Groupchat logging is now enabled'),
            '171': __('Groupchat logging is now disabled'),
            '172': __('This groupchat is now no longer anonymous'),
            '173': __('This groupchat is now semi-anonymous'),
            '174': __('This groupchat is now fully-anonymous'),
            '201': __('A new groupchat has been created'),
            // XXX: Note the triple underscore function and not double underscore.
            '210': ___('Your nickname has been automatically set to %1$s'),
            '301': __('You have been banned from this groupchat'),
            // XXX: Note the triple underscore function and not double underscore.
            '303': ___('Your nickname has been changed to %1$s'),
            '307': __('You have been kicked from this groupchat'),
            '321': __('You have been removed from this groupchat because of an affiliation change'),
            '322': __("You have been removed from this groupchat because it has changed to members-only and you're not a member"),
            '332': __('You have been removed from this groupchat because the service hosting it is being shut down'),
            '333': __('You have exited this groupchat due to a technical problem'),
        };
        const labels = { muc: { STATUS_CODE_MESSAGES }};
        Object.assign(_converse.labels, labels);
        Object.assign(_converse, labels); // XXX DEPRECATED

        routeToRoom();
        addEventListener('hashchange', routeToRoom);

        // TODO: DEPRECATED
        const legacy_exports = {
            ChatRoom: MUC,
            ChatRoomMessage: MUCMessage,
            ChatRoomMessages: MUCMessages,
            ChatRoomOccupant: MUCOccupant,
            ChatRoomOccupants: MUCOccupants,
        };
        Object.assign(_converse, legacy_exports);

        const exports = {
            MUC,
            MUCMessage,
            MUCMessages,
            MUCOccupant,
            MUCOccupants,
            getDefaultMUCNickname,
            isInfoVisible,
            onDirectMUCInvitation,
        };
        Object.assign(_converse.exports, exports);
        Object.assign(_converse, exports); // XXX DEPRECATED

        /** @type {module:shared-api.APIEndpoint} */(api.chatboxes.registry).add(CHATROOMS_TYPE, MUC);

        if (api.settings.get('allow_muc_invitations')) {
            api.listen.on('connected', registerDirectInvitationHandler);
            api.listen.on('reconnected', registerDirectInvitationHandler);
        }

        api.listen.on('addClientFeatures', () => api.disco.own.features.add(`${Strophe.NS.CONFINFO}+notify`));
        api.listen.on('addClientFeatures', onAddClientFeatures);
        api.listen.on('beforeResourceBinding', onBeforeResourceBinding);
        api.listen.on('beforeTearDown', onBeforeTearDown);
        api.listen.on('chatBoxesFetched', autoJoinRooms);
        api.listen.on('disconnected', disconnectChatRooms);
        api.listen.on('statusInitialized', onStatusInitialized);

        document.addEventListener('visibilitychange', onWindowStateChanged);
    },
});
