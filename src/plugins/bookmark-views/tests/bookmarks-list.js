/* global mock, converse */

const { Strophe, u, sizzle } = converse.env;

describe("The bookmarks list modal", function () {

    beforeEach(() => jasmine.addMatchers({ toEqualStanza: jasmine.toEqualStanza }));

    it("shows a list of bookmarks", mock.initConverse(
            ['chatBoxesFetched'], {},
            async function (_converse) {

        await mock.waitForRoster(_converse, 'current', 0);
        await mock.waitUntilDiscoConfirmed(
            _converse, _converse.bare_jid,
            [{'category': 'pubsub', 'type': 'pep'}],
            ['http://jabber.org/protocol/pubsub#publish-options']
        );
        mock.openControlBox(_converse);

        const controlbox = await u.waitUntil(() => _converse.chatboxviews.get('controlbox'));
        const button = await u.waitUntil(() => controlbox.querySelector('.show-bookmark-list-modal'));
        button.click();

        const IQ_stanzas = _converse.api.connection.get().IQ_stanzas;
        const sent_stanza = await u.waitUntil(
            () => IQ_stanzas.filter(s => sizzle('items[node="storage:bookmarks"]', s).length).pop());

        expect(sent_stanza).toEqualStanza(
            stx`<iq from="romeo@montague.lit/orchard" id="${sent_stanza.getAttribute('id')}" type="get" xmlns="jabber:client">
                <pubsub xmlns="http://jabber.org/protocol/pubsub">
                    <items node="storage:bookmarks"/>
                </pubsub>
            </iq>`
        );

        const stanza = stx`<iq to="${_converse.api.connection.get().jid}" type="result" id="${sent_stanza.getAttribute('id')}" xmlns="jabber:client">
            <pubsub xmlns="${Strophe.NS.PUBSUB}">
                <items node="storage:bookmarks">
                    <item id="current">
                        <storage xmlns="storage:bookmarks">
                            <conference name="The Play&apos;s the Thing" autojoin="false" jid="theplay@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                            <conference name="1st Bookmark" autojoin="false" jid="first@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                            <conference autojoin="false" jid="noname@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                            <conference name="Bookmark with a very very long name that will be shortened" autojoin="false" jid="longname@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                            <conference name="Another room" autojoin="false" jid="another@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                        </storage>
                    </item>
                </items>
            </pubsub>
        </iq>`;
        _converse.api.connection.get()._dataRecv(mock.createRequest(stanza));

        const modal = _converse.api.modal.get('converse-bookmark-list-modal');
        await u.waitUntil(() => modal.querySelectorAll('.bookmarks.rooms-list .room-item').length);
        expect(modal.querySelectorAll('.bookmarks.rooms-list .room-item').length).toBe(5);
        let els = modal.querySelectorAll('.bookmarks.rooms-list .room-item a.list-item-link');
        expect(els[0].textContent).toBe("1st Bookmark");
        expect(els[1].textContent).toBe("Another room");
        expect(els[2].textContent).toBe("Bookmark with a very very long name that will be shortened");
        expect(els[3].textContent).toBe("noname@conference.shakespeare.lit");
        expect(els[4].textContent).toBe("The Play's the Thing");

        spyOn(_converse.api, 'confirm').and.callFake(() => Promise.resolve(true));
        modal.querySelector('.bookmarks.rooms-list .room-item:nth-child(2) a:nth-child(2)').click();
        expect(_converse.api.confirm).toHaveBeenCalled();
        await u.waitUntil(() => modal.querySelectorAll('.bookmarks.rooms-list .room-item').length === 4)
        els = modal.querySelectorAll('.bookmarks.rooms-list .room-item a.list-item-link');
        expect(els[0].textContent).toBe("1st Bookmark");
        expect(els[1].textContent).toBe("Bookmark with a very very long name that will be shortened");
        expect(els[2].textContent).toBe("noname@conference.shakespeare.lit");
        expect(els[3].textContent).toBe("The Play's the Thing");
    }));

    it("can be used to open a MUC from a bookmark", mock.initConverse(
            ['chatBoxesFetched'], {'view_mode': 'fullscreen'},
            async function (_converse) {

        const api = _converse.api;

        await mock.waitForRoster(_converse, 'current', 0);
        await mock.waitUntilDiscoConfirmed(
            _converse, _converse.bare_jid,
            [{'category': 'pubsub', 'type': 'pep'}],
            ['http://jabber.org/protocol/pubsub#publish-options']
        );
        mock.openControlBox(_converse);

        const controlbox = await _converse.chatboxviews.get('controlbox');
        controlbox.querySelector('.show-bookmark-list-modal').click();

        const IQ_stanzas = _converse.api.connection.get().IQ_stanzas;
        const sent_stanza = await u.waitUntil(
            () => IQ_stanzas.filter(s => sizzle('items[node="storage:bookmarks"]', s).length).pop());
        const stanza = stx`<iq to="${_converse.api.connection.get().jid}" type="result" id="${sent_stanza.getAttribute('id')}" xmlns="jabber:client">
            <pubsub xmlns="${Strophe.NS.PUBSUB}">
                <items node="storage:bookmarks">
                    <item id="current">
                        <storage xmlns="storage:bookmarks">
                            <conference name="The Play&apos;s the Thing" autojoin="false" jid="theplay@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                            <conference name="1st Bookmark" autojoin="false" jid="first@conference.shakespeare.lit">
                                <nick>JC</nick>
                            </conference>
                        </storage>
                    </item>
                </items>
            </pubsub>
        </iq>`;
        _converse.api.connection.get()._dataRecv(mock.createRequest(stanza));

        const modal = api.modal.get('converse-bookmark-list-modal');
        await u.waitUntil(() => u.isVisible(modal), 1000);

        await u.waitUntil(() => modal.querySelectorAll('.bookmarks.rooms-list .room-item').length);
        expect(modal.querySelectorAll('.bookmarks.rooms-list .room-item').length).toBe(2);
        modal.querySelector('.bookmarks.rooms-list .open-room').click();

        await mock.waitForMUCDiscoInfo(_converse, 'first@conference.shakespeare.lit');
        await mock.waitForReservedNick(_converse, 'first@conference.shakespeare.lit', '');
        await u.waitUntil(() => _converse.chatboxes.length === 2);
        expect((await api.rooms.get('first@conference.shakespeare.lit')).get('hidden')).toBe(false);

        await u.waitUntil(() => modal.querySelectorAll('.list-container--bookmarks .available-chatroom').length);
        modal.querySelector('.list-container--bookmarks .available-chatroom:last-child .open-room').click();

        await mock.waitForMUCDiscoInfo(_converse, 'theplay@conference.shakespeare.lit');
        await mock.waitForReservedNick(_converse, 'theplay@conference.shakespeare.lit', '');
        await u.waitUntil(() => _converse.chatboxes.length === 3);

        expect((await api.rooms.get('first@conference.shakespeare.lit')).get('hidden')).toBe(true);
        expect((await api.rooms.get('theplay@conference.shakespeare.lit')).get('hidden')).toBe(false);

        controlbox.querySelector('.list-container--openrooms .open-room').click();
        await u.waitUntil(() => controlbox.querySelector('.list-item.open').getAttribute('data-room-jid') === 'first@conference.shakespeare.lit');
        expect((await api.rooms.get('first@conference.shakespeare.lit')).get('hidden')).toBe(false);
        expect((await api.rooms.get('theplay@conference.shakespeare.lit')).get('hidden')).toBe(true);
    }));
});
