/*global mock, converse */

const { Strophe, u, stx } = converse.env;

describe("A Groupchat Message", function () {

    beforeAll(() => jasmine.addMatchers({ toEqualStanza: jasmine.toEqualStanza }));

    it("can be replaced with a correction",
            mock.initConverse([], {}, async function (_converse) {

        const muc_jid = 'lounge@montague.lit';
        const model = await mock.openAndEnterMUC(_converse, muc_jid, 'romeo');
        _converse.api.connection.get()._dataRecv(mock.createRequest(stx`
            <presence
                to="romeo@montague.lit/_converse.js-29092160"
                from="coven@chat.shakespeare.lit/newguy"
                xmlns="jabber:client">
                <x xmlns="${Strophe.NS.MUC_USER}">
                    <item affiliation="none" jid="newguy@montague.lit/_converse.js-290929789" role="participant"/>
                </x>
            </presence>`));

        const msg_id = u.getUniqueId();
        await model.handleMessageStanza(stx`
            <message
                from="lounge@montague.lit/newguy"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${msg_id}"
                xmlns="jabber:client">
                <body>But soft, what light through yonder airlock breaks?</body>
            </message>`);

        const view = _converse.chatboxviews.get(muc_jid);
        await u.waitUntil(() => view.querySelectorAll('.chat-msg').length);
        expect(view.querySelectorAll('.chat-msg').length).toBe(1);
        expect(view.querySelector('.chat-msg__text').textContent)
            .toBe('But soft, what light through yonder airlock breaks?');

        await view.model.handleMessageStanza(stx`
            <message
                from="lounge@montague.lit/newguy"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${u.getUniqueId()}"
                xmlns="jabber:client">
                <body>But soft, what light through yonder chimney breaks?</body>
                <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"/>
            </message>`);

        await u.waitUntil(() => view.querySelector('.chat-msg__text').textContent ===
            'But soft, what light through yonder chimney breaks?', 500);
        expect(view.querySelectorAll('.chat-msg').length).toBe(1);
        await u.waitUntil(() => view.querySelector('.chat-msg__content .fa-edit'));

        await view.model.handleMessageStanza(stx`
            <message
                from="lounge@montague.lit/newguy"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${u.getUniqueId()}"
                xmlns="jabber:client">
                <body>But soft, what light through yonder window breaks?</body>
                <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"/>
            </message>`);

        await u.waitUntil(() => view.querySelector('.chat-msg__text').textContent ===
            'But soft, what light through yonder window breaks?', 500);
        expect(view.querySelectorAll('.chat-msg').length).toBe(1);
        expect(view.querySelectorAll('.chat-msg__content .fa-edit').length).toBe(1);
        const edit = await u.waitUntil(() => view.querySelector('.chat-msg__content .fa-edit'));
        edit.click();
        const modal = _converse.api.modal.get('converse-message-versions-modal');
        await u.waitUntil(() => u.isVisible(modal), 1000);
        const older_msgs = modal.querySelectorAll('.older-msg');
        expect(older_msgs.length).toBe(2);
        expect(older_msgs[0].textContent.includes('But soft, what light through yonder airlock breaks?')).toBe(true);
        expect(older_msgs[1].textContent.includes('But soft, what light through yonder chimney breaks?')).toBe(true);
    }));

    it("keeps the same position in history after a correction",
            mock.initConverse([], {}, async function (_converse) {

        const muc_jid = 'lounge@montague.lit';
        await mock.openAndEnterMUC(_converse, muc_jid, 'romeo');
        const view = _converse.chatboxviews.get(muc_jid);
        _converse.api.connection.get()._dataRecv(mock.createRequest(stx`
            <presence
                to="romeo@montague.lit/_converse.js-29092160"
                from="coven@chat.shakespeare.lit/newguy"
                xmlns="jabber:client">
                <x xmlns="${Strophe.NS.MUC_USER}">
                    <item affiliation="none" jid="newguy@montague.lit/_converse.js-290929789" role="participant"/>
                </x>
            </presence>`));

        const msg_id = u.getUniqueId();

        // Receiving the first message
        await view.model.handleMessageStanza(stx`
            <message
                xmlns="jabber:client"
                from="lounge@montague.lit/newguy"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${msg_id}">
                <body>But soft, what light through yonder airlock breaks?</body>
            </message>`);

        // Receiving own message to check order against
        await view.model.handleMessageStanza(stx`
            <message
                xmlns="jabber:client"
                from="lounge@montague.lit/romeo"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${u.getUniqueId()}">
                <body>But soft, what light through yonder airlock breaks?</body>
            </message>`);

        // First message correction
        await view.model.handleMessageStanza(stx`
            <message
                xmlns="jabber:client"
                from="lounge@montague.lit/newguy"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${u.getUniqueId()}">
                <body>But soft, what light through yonder chimney breaks?</body>
                <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"/>
            </message>`);

        // Second message correction
        await view.model.handleMessageStanza(stx`
            <message
                xmlns="jabber:client"
                from="lounge@montague.lit/newguy"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${u.getUniqueId()}">
                <body>But soft, what light through yonder window breaks?</body>
                <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"/>
            </message>`);

        // Second own message
        await view.model.handleMessageStanza(stx`
            <message
                xmlns="jabber:client"
                from="lounge@montague.lit/romeo"
                to="${_converse.api.connection.get().jid}"
                type="groupchat"
                id="${u.getUniqueId()}">
                <body>But soft, what light through yonder window breaks?</body>
            </message>`);

        await u.waitUntil(() => view.querySelectorAll('.chat-msg__text')[0].textContent ===
            'But soft, what light through yonder window breaks?', 500);
        await u.waitUntil(() => view.querySelectorAll('.chat-msg__text').length === 3);
        await u.waitUntil(() => view.querySelectorAll('.chat-msg__text')[2].textContent ===
            'But soft, what light through yonder window breaks?', 500);

        expect(view.querySelectorAll('.chat-msg').length).toBe(3);
        expect(view.querySelectorAll('.chat-msg__content .fa-edit').length).toBe(1);
        const edit = await u.waitUntil(() => view.querySelector('.chat-msg__content .fa-edit'));
        edit.click();
        const modal = _converse.api.modal.get('converse-message-versions-modal');
        await u.waitUntil(() => u.isVisible(modal), 1000);
        const older_msgs = modal.querySelectorAll('.older-msg');
        expect(older_msgs.length).toBe(2);
        expect(older_msgs[0].textContent.includes('But soft, what light through yonder airlock breaks?')).toBe(true);
        expect(older_msgs[1].textContent.includes('But soft, what light through yonder chimney breaks?')).toBe(true);
    }));

    it("can be sent as a correction by using the up arrow",
            mock.initConverse([], {}, async function (_converse) {

        const { api } = _converse;
        const { jid: own_jid } = api.connection.get();
        const nick = 'romeo'
        const muc_jid = 'lounge@montague.lit';
        await mock.openAndEnterMUC(_converse, muc_jid, nick);
        const view = _converse.chatboxviews.get(muc_jid);
        const textarea = await u.waitUntil(() => view.querySelector('textarea.chat-textarea'));
        expect(textarea.value).toBe('');
        const message_form = view.querySelector('converse-muc-message-form');
        message_form.onKeyDown({
            target: textarea,
            key: "ArrowUp",
        });
        expect(textarea.value).toBe('');

        textarea.value = 'But soft, what light through yonder airlock breaks?';
        message_form.onKeyDown({
            target: textarea,
            preventDefault: function preventDefault () {},
            key: "Enter",
        });
        await u.waitUntil(() => view.querySelectorAll('.chat-msg').length === 1);
        expect(view.querySelector('.chat-msg__text').textContent)
            .toBe('But soft, what light through yonder airlock breaks?');

        const first_msg = view.model.messages.findWhere({'message': 'But soft, what light through yonder airlock breaks?'});
        expect(textarea.value).toBe('');
        message_form.onKeyDown({
            target: textarea,
            key: "ArrowUp",
        });
        await u.waitUntil(() => textarea.value === 'But soft, what light through yonder airlock breaks?');
        expect(view.model.messages.at(0).get('correcting')).toBe(true);
        expect(view.querySelectorAll('.chat-msg').length).toBe(1);
        await u.waitUntil(() => u.hasClass('correcting', view.querySelector('.chat-msg')));

        spyOn(_converse.api.connection.get(), 'send');
        const new_text = 'But soft, what light through yonder window breaks?'
        textarea.value = new_text;
        message_form.onKeyDown({
            target: textarea,
            preventDefault: function preventDefault () {},
            key: "Enter",
        });
        await u.waitUntil(() => Array.from(view.querySelectorAll('.chat-msg__text'))
            .filter(m => m.textContent.replace(/<!-.*?->/g, '') === new_text).length);

        expect(_converse.api.connection.get().send).toHaveBeenCalled();
        const msg = _converse.api.connection.get().send.calls.all()[0].args[0];
        expect(msg).toEqualStanza(stx`
            <message from="${own_jid}" id="${msg.getAttribute("id")}"
                to="lounge@montague.lit" type="groupchat"
                xmlns="jabber:client">
                    <body>But soft, what light through yonder window breaks?</body>
                    <active xmlns="http://jabber.org/protocol/chatstates"/>
                    <replace id="${first_msg.get("msgid")}" xmlns="urn:xmpp:message-correct:0"/>
                    <origin-id id="${msg.querySelector('origin-id').getAttribute("id")}" xmlns="urn:xmpp:sid:0"/>
            </message>`);

        expect(view.model.messages.models.length).toBe(1);
        const corrected_message = view.model.messages.at(0);
        expect(corrected_message.get('msgid')).toBe(first_msg.get('msgid'));
        expect(corrected_message.get('correcting')).toBe(false);

        const older_versions = corrected_message.get('older_versions');
        const keys = Object.keys(older_versions);
        expect(keys.length).toBe(1);
        expect(older_versions[keys[0]]).toBe('But soft, what light through yonder airlock breaks?');

        expect(view.querySelectorAll('.chat-msg').length).toBe(1);
        expect(u.hasClass('correcting', view.querySelector('.chat-msg'))).toBe(false);

        // Check that messages from other users are skipped
        await view.model.handleMessageStanza(stx`
            <message from="${muc_jid}/someone-else"
                    id="${u.getUniqueId()}"
                    to="romeo@montague.lit"
                    type="groupchat"
                    xmlns="jabber:client">
                <body>Hello world</body>
            </message>`);
        await u.waitUntil(() => view.querySelectorAll('.chat-msg__text').length === 2);
        expect(view.querySelectorAll('.chat-msg').length).toBe(2);

        // Test that pressing the down arrow cancels message correction
        expect(textarea.value).toBe('');
        message_form.onKeyDown({
            target: textarea,
            key: "ArrowUp",
        });
        await u.waitUntil(() => textarea.value === 'But soft, what light through yonder window breaks?');
        expect(view.model.messages.at(0).get('correcting')).toBe(true);
        expect(view.querySelectorAll('.chat-msg').length).toBe(2);
        await u.waitUntil(() => u.hasClass('correcting', view.querySelector('.chat-msg')), 500);
        expect(textarea.value).toBe('But soft, what light through yonder window breaks?');
        message_form.onKeyDown({
            target: textarea,
            key: "ArrowDown",
        });
        await u.waitUntil(() => textarea.value === '');
        expect(view.model.messages.at(0).get('correcting')).toBe(false);
        expect(view.querySelectorAll('.chat-msg').length).toBe(2);
        await u.waitUntil(() => !u.hasClass('correcting', view.querySelector('.chat-msg')), 500);
    }));
});


describe('A Groupchat Message XEP-0308 correction ', function () {
    it(
        "is ignored if it's from a different occupant-id",
        mock.initConverse([], {}, async function (_converse) {
            const muc_jid = 'lounge@montague.lit';
            const features = [...mock.default_muc_features, Strophe.NS.OCCUPANTID];
            const model = await mock.openAndEnterMUC(_converse, muc_jid, 'romeo', features);

            const msg_id = u.getUniqueId();
            await model.handleMessageStanza(
                stx`
                <message
                    xmlns="jabber:server"
                    from="lounge@montague.lit/newguy"
                    to="_converse.api.connection.get().jid"
                    type="groupchat"
                    id="${msg_id}">

                    <body>But soft, what light through yonder airlock breaks?</body>
                    <occupant-id xmlns="urn:xmpp:occupant-id:0" id="1"></occupant-id>
                </message>`
            );

            const view = _converse.chatboxviews.get(muc_jid);
            await u.waitUntil(() => view.querySelectorAll('.chat-msg').length);
            expect(model.messages.at(0).get('body')).toBe('But soft, what light through yonder airlock breaks?');

            await model.handleMessageStanza(
                stx`
                <message
                    xmlns="jabber:server"
                    from="lounge@montague.lit/newguy"
                    to="_converse.api.connection.get().jid"
                    type="groupchat"
                    id="${u.getUniqueId()}">

                    <body>But soft, what light through yonder chimney breaks?</body>
                    <occupant-id xmlns="urn:xmpp:occupant-id:0" id="2"></occupant-id>
                    <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"></replace>
                </message>`
            );

            await u.waitUntil(() => view.querySelectorAll('.chat-msg').length === 2);
            expect(model.messages.length).toBe(2);
            expect(model.messages.at(0).get('body')).toBe('But soft, what light through yonder airlock breaks?');
            expect(model.messages.at(0).get('edited')).toBeFalsy();

            expect(model.messages.at(1).get('body')).toBe('But soft, what light through yonder chimney breaks?');
            expect(model.messages.at(1).get('edited')).toBeTruthy();

            await model.handleMessageStanza(
                stx`
                <message
                    xmlns="jabber:server"
                    from="lounge@montague.lit/newguy"
                    to="_converse.api.connection.get().jid"
                    type="groupchat"
                    id="${u.getUniqueId()}">

                    <body>But soft, what light through yonder hatch breaks?</body>
                    <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"></replace>
                </message>`
            );

            await u.waitUntil(() => view.querySelectorAll('.chat-msg').length === 3);
            expect(model.messages.length).toBe(3);
            expect(model.messages.at(0).get('body')).toBe('But soft, what light through yonder airlock breaks?');
            expect(model.messages.at(0).get('edited')).toBeFalsy();

            expect(model.messages.at(1).get('body')).toBe('But soft, what light through yonder chimney breaks?');
            expect(model.messages.at(1).get('edited')).toBeTruthy();

            expect(model.messages.at(2).get('body')).toBe('But soft, what light through yonder hatch breaks?');
            expect(model.messages.at(2).get('edited')).toBeTruthy();

            const message_els = Array.from(view.querySelectorAll('.chat-msg'));
            expect(message_els.reduce((acc, m) => acc && u.hasClass('chat-msg--followup', m), true)).toBe(false);
        })
    );

    it(
        "cannot be edited if it's from a different occupant id",
        mock.initConverse([], {}, async function (_converse) {
            const nick = 'romeo';
            const muc_jid = 'lounge@montague.lit';
            const features = [...mock.default_muc_features, Strophe.NS.OCCUPANTID];
            const model = await mock.openAndEnterMUC(_converse, muc_jid, nick, features);

            expect(model.get('occupant_id')).toBe(model.occupants.at(0).get('occupant_id'));

            const msg_id = u.getUniqueId();
            await model.handleMessageStanza(
                stx`
                <message
                    xmlns="jabber:server"
                    from="lounge@montague.lit/${nick}"
                    to="_converse.api.connection.get().jid"
                    type="groupchat"
                    id="${msg_id}">

                    <body>But soft, what light through yonder airlock breaks?</body>
                    <occupant-id xmlns="urn:xmpp:occupant-id:0" id="${model.get('occupant_id')}"></occupant-id>
                </message>`
            );

            const view = _converse.chatboxviews.get(muc_jid);
            await u.waitUntil(() => view.querySelectorAll('.chat-msg').length);
            expect(model.messages.at(0).get('body')).toBe('But soft, what light through yonder airlock breaks?');

            await model.handleMessageStanza(
                stx`
                <message
                    xmlns="jabber:server"
                    from="lounge@montague.lit/${nick}"
                    to="_converse.api.connection.get().jid"
                    type="groupchat"
                    id="${u.getUniqueId()}">

                    <body>But soft, what light through yonder chimney breaks?</body>
                    <occupant-id xmlns="urn:xmpp:occupant-id:0" id="${model.get('occupant_id')}"></occupant-id>
                    <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"></replace>
                </message>`
            );

            expect(model.messages.at(0).get('body')).toBe('But soft, what light through yonder chimney breaks?');
            expect(model.messages.at(0).get('edited')).toBeTruthy();

            await model.handleMessageStanza(
                stx`
                <message
                    xmlns="jabber:server"
                    from="lounge@montague.lit/${nick}"
                    to="_converse.api.connection.get().jid"
                    type="groupchat"
                    id="${u.getUniqueId()}">

                    <body>But soft, what light through yonder hatch breaks?</body>
                    <occupant-id xmlns="urn:xmpp:occupant-id:0" id="${u.getUniqueId()}"></occupant-id>
                    <replace id="${msg_id}" xmlns="urn:xmpp:message-correct:0"></replace>
                </message>`
            );

            await u.waitUntil(() => view.querySelectorAll('.chat-msg').length === 2);
            expect(model.messages.length).toBe(2);
            expect(model.messages.at(0).get('body')).toBe('But soft, what light through yonder chimney breaks?');
            expect(model.messages.at(0).get('edited')).toBeTruthy();
            expect(model.messages.at(0).get('editable')).toBeTruthy();

            expect(model.messages.at(1).get('body')).toBe('But soft, what light through yonder hatch breaks?');
            expect(model.messages.at(1).get('edited')).toBeTruthy();
            expect(model.messages.at(1).get('editable')).toBeFalsy();

            const message_els = Array.from(view.querySelectorAll('.chat-msg'));
            expect(message_els.reduce((acc, m) => acc && u.hasClass('chat-msg--followup', m), true)).toBe(false);

            // We can edit our own message, but not the other
            expect(message_els[0].querySelector('converse-dropdown .chat-msg__action-edit')).toBeDefined();
            expect(message_els[1].querySelector('converse-dropdown .chat-msg__action-edit')).toBe(null);
        })
    );
});
