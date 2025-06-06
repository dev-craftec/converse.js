import { getOpenPromise } from '@converse/openpromise';
import _converse from '../../shared/_converse.js';
import api from '../../shared/api/index.js';
import converse from '../../shared/api/public.js';
import log from "@converse/log";

const { Strophe, $iq } = converse.env;

export default {
    /**
     * @typedef {import('./entities').default} DiscoEntities
     * @typedef {import('./entity').default} DiscoEntity
     * @typedef {import('./index').DiscoState} DiscoState
     * @typedef {import('@converse/skeletor').Collection} Collection
     */

    /**
     * The XEP-0030 service discovery API
     *
     * This API lets you discover information about entities on the
     * XMPP network.
     *
     * @namespace api.disco
     * @memberOf api
     */
    disco: {
        /**
         * @namespace api.disco.stream
         * @memberOf api.disco
         */
        stream: {
            /**
             * @method api.disco.stream.getFeature
             * @param { String } name The feature name
             * @param { String } xmlns The XML namespace
             * @example _converse.api.disco.stream.getFeature('ver', 'urn:xmpp:features:rosterver')
             */
            async getFeature(name, xmlns) {
                await api.waitUntil('streamFeaturesAdded');

                const stream_features = /** @type {Collection} */ (_converse.state.stream_features);
                if (!name || !xmlns) {
                    throw new Error('name and xmlns need to be provided when calling disco.stream.getFeature');
                }
                if (stream_features === undefined && !api.connection.connected()) {
                    // Happens during tests when disco lookups happen asynchronously after teardown.
                    const msg = `Tried to get feature ${name} ${xmlns} but stream_features has been torn down`;
                    log.warn(msg);
                    return;
                }
                return stream_features.findWhere({ 'name': name, 'xmlns': xmlns });
            },
        },

        /**
         * @namespace api.disco.own
         * @memberOf api.disco
         */
        own: {
            /**
             * @namespace api.disco.own.identities
             * @memberOf api.disco.own
             */
            identities: {
                /**
                 * Lets you add new identities for this client (i.e. instance of Converse)
                 * @method api.disco.own.identities.add
                 *
                 * @param {String} category - server, client, gateway, directory, etc.
                 * @param {String} type - phone, pc, web, etc.
                 * @param {String} name - "Converse"
                 * @param {String} lang - en, el, de, etc.
                 *
                 * @example _converse.api.disco.own.identities.clear();
                 */
                add(category, type, name, lang) {
                    const disco = /** @type {DiscoState} */ (_converse.state.disco);
                    for (var i = 0; i < disco._identities.length; i++) {
                        if (
                            disco._identities[i].category == category &&
                            disco._identities[i].type == type &&
                            disco._identities[i].name == name &&
                            disco._identities[i].lang == lang
                        ) {
                            return false;
                        }
                    }
                    disco._identities.push({ category: category, type: type, name: name, lang: lang });
                },
                /**
                 * Clears all previously registered identities.
                 * @method api.disco.own.identities.clear
                 * @example _converse.api.disco.own.identities.clear();
                 */
                clear() {
                    /** @type {DiscoState} */ (_converse.state.disco)._identities = [];
                },
                /**
                 * Returns all of the identities registered for this client
                 * (i.e. instance of Converse).
                 * @method api.disco.identities.get
                 * @example const identities = api.disco.own.identities.get();
                 */
                get() {
                    return /** @type {DiscoState} */ (_converse.state.disco)._identities;
                },
            },

            /**
             * @namespace api.disco.own.features
             * @memberOf api.disco.own
             */
            features: {
                /**
                 * Lets you register new disco features for this client (i.e. instance of Converse)
                 * @method api.disco.own.features.add
                 * @param { String } name - e.g. http://jabber.org/protocol/caps
                 * @example _converse.api.disco.own.features.add("http://jabber.org/protocol/caps");
                 */
                add(name) {
                    const disco = /** @type {DiscoState} */ (_converse.state.disco);
                    for (let i = 0; i < disco._features.length; i++) {
                        if (disco._features[i] == name) {
                            return false;
                        }
                    }
                    disco._features.push(name);
                },
                /**
                 * Clears all previously registered features.
                 * @method api.disco.own.features.clear
                 * @example _converse.api.disco.own.features.clear();
                 */
                clear() {
                    const disco = /** @type {DiscoState} */ (_converse.state.disco);
                    disco._features = [];
                },
                /**
                 * Returns all of the features registered for this client (i.e. instance of Converse).
                 * @method api.disco.own.features.get
                 * @example const features = api.disco.own.features.get();
                 */
                get() {
                    return /** @type {DiscoState} */ (_converse.state.disco)._features;
                },
            },
        },

        /**
         * Query for information about an XMPP entity
         *
         * @method api.disco.info
         * @param {string} jid The Jabber ID of the entity to query
         * @param {string} [node] A specific node identifier associated with the JID
         * @returns {promise} Promise which resolves once we have a result from the server.
         */
        info(jid, node) {
            const attrs = { xmlns: Strophe.NS.DISCO_INFO };
            if (node) {
                attrs.node = node;
            }
            const info = $iq({
                'from': api.connection.get().jid,
                'to': jid,
                'type': 'get',
            }).c('query', attrs);
            return api.sendIQ(info);
        },

        /**
         * Query for items associated with an XMPP entity
         *
         * @method api.disco.items
         * @param {string} jid The Jabber ID of the entity to query for items
         * @param {string} [node] A specific node identifier associated with the JID
         * @returns {promise} Promise which resolves once we have a result from the server.
         */
        items(jid, node) {
            const attrs = { xmlns: Strophe.NS.DISCO_ITEMS };
            if (node) {
                attrs.node = node;
            }
            return api.sendIQ(
                $iq({
                    'from': api.connection.get().jid,
                    'to': jid,
                    'type': 'get',
                }).c('query', attrs)
            );
        },

        /**
         * Namespace for methods associated with disco entities
         *
         * @namespace api.disco.entities
         * @memberOf api.disco
         */
        entities: {
            /**
             * Get the corresponding `DiscoEntity` instance.
             *
             * @method api.disco.entities.get
             * @param {string} jid The Jabber ID of the entity
             * @param {boolean} [create] Whether the entity should be created if it doesn't exist.
             * @return {Promise<DiscoEntity|DiscoEntities|undefined>}
             * @example _converse.api.disco.entities.get(jid);
             */
            async get(jid, create = false) {
                await api.waitUntil('discoInitialized');
                const disco_entities = /** @type {DiscoEntities} */ (_converse.state.disco_entities);
                if (!jid) {
                    return disco_entities;
                }
                if (disco_entities === undefined) {
                    // Happens during tests when disco lookups happen asynchronously after teardown.
                    log.warn(`Tried to look up entity ${jid} but disco_entities has been torn down`);
                    return;
                }
                const entity = disco_entities.get(jid);
                if (entity || !create) {
                    return entity;
                }
                return api.disco.entities.create({ jid });
            },

            /**
             * Return any disco items advertised on this entity
             *
             * @method api.disco.entities.items
             * @param {string} jid - The Jabber ID of the entity for which we want to fetch items
             * @example api.disco.entities.items(jid);
             */
            async items(jid) {
                const entity = await api.disco.entities.get(jid);
                await entity.waitUntilItemsFetched;

                const disco_entities = /** @type {DiscoEntities} */ (_converse.state.disco_entities);
                return disco_entities.filter((e) => e.get('parent_jids')?.includes(jid));
            },

            /**
             * Create a new  disco entity. It's identity and features
             * will automatically be fetched from cache or from the
             * XMPP server.
             *
             * Fetching from cache can be disabled by passing in
             * `ignore_cache: true` in the options parameter.
             *
             * @method api.disco.entities.create
             * @param {object} data
             * @param {string} data.jid - The Jabber ID of the entity
             * @param {string} data.parent_jid - The Jabber ID of the parent entity
             * @param {string} data.name
             * @param {object} [options] - Additional options
             * @param {boolean} [options.ignore_cache]
             *     If true, fetch all features from the XMPP server instead of restoring them from cache
             * @example _converse.api.disco.entities.create({ jid }, {'ignore_cache': true});
             */
            create(data, options) {
                const disco_entities = /** @type {DiscoEntities} */ (_converse.state.disco_entities);
                return disco_entities.create(data, options);
            },
        },

        /**
         * @namespace api.disco.features
         * @memberOf api.disco
         */
        features: {
            /**
             * Return a given feature of a disco entity
             *
             * @method api.disco.features.get
             * @param {string} feature The feature that might be
             *     supported. In the XML stanza, this is the `var`
             *     attribute of the `<feature>` element. For
             *     example: `http://jabber.org/protocol/muc`
             * @param {string} jid The JID of the entity
             *     (and its associated items) which should be queried
             * @returns {Promise<import('@converse/skeletor').Model|import('@converse/skeletor').Model[]>}
             *     A promise which resolves with a list containing
             *     _converse.Entity instances representing the entity
             *     itself or those items associated with the entity if
             *     they support the given feature.
             * @example
             * api.disco.features.get(Strophe.NS.MAM, _converse.bare_jid);
             */
            async get(feature, jid) {
                if (!jid) throw new TypeError('api.disco.features.get: You need to provide an entity JID');

                const entity = await api.disco.entities.get(jid, true);

                if (_converse.state.disco_entities === undefined && !api.connection.connected()) {
                    // Happens during tests when disco lookups happen asynchronously after teardown.
                    log.warn(
                        `Tried to get feature ${feature} for ${jid} but ` +
                            `_converse.disco_entities has been torn down`
                    );
                    return [];
                }

                const items = await api.disco.entities.items(jid);

                const promises = [
                    entity.getFeature(feature),
                    ...items.map((i) => i.getFeature(feature)),
                ];
                const result = await Promise.all(promises);
                return result.filter((f) => f instanceof Object);
            },

            /**
             * Returns true if an entity with the given JID, or if one of its
             * associated items, supports a given feature.
             *
             * @method api.disco.features.has
             * @param {string} feature The feature that might be
             *     supported. In the XML stanza, this is the `var`
             *     attribute of the `<feature>` element. For
             *     example: `http://jabber.org/protocol/muc`
             * @param {string} jid The JID of the entity
             *     (and its associated items) which should be queried
             * @returns {Promise<boolean>} A promise which resolves with a boolean
             * @example
             *      api.disco.features.has(Strophe.NS.MAM, _converse.bare_jid);
             */
            async has(feature, jid) {
                if (!jid) throw new TypeError('api.disco.feature.has: You need to provide an entity JID');

                const entity = await api.disco.entities.get(jid, true);
                if (!entity) {
                    log.warn(`api.disco.has: could not get entity for ${jid}`);
                    return false;
                }

                if (_converse.state.disco_entities === undefined && !api.connection.connected()) {
                    // Happens during tests when disco lookups happen asynchronously after teardown.
                    log.warn(`Tried to check if ${jid} supports feature ${feature}`);
                    return false;
                }

                if (await entity.getFeature(feature)) {
                    return true;
                }

                const items = await api.disco.entities.items(jid);
                const result = await Promise.all(items.map((i) => i.getFeature(feature)));
                return result.map((f) => f instanceof Object).includes(true);
            },
        },

        /**
         * Used to determine whether an entity supports a given feature.
         *
         * @method api.disco.supports
         * @param {string} feature The feature that might be
         *     supported. In the XML stanza, this is the `var`
         *     attribute of the `<feature>` element. For
         *     example: `http://jabber.org/protocol/muc`
         * @param {string} jid The JID of the entity
         *     (and its associated items) which should be queried
         * @returns {Promise<boolean>|boolean} A promise which resolves with `true` or `false`.
         * @example
         * if (await api.disco.supports(Strophe.NS.MAM, _converse.bare_jid)) {
         *     // The feature is supported
         * } else {
         *     // The feature is not supported
         * }
         */
        supports(feature, jid) {
            try {
                return api.disco.features.has(feature, jid);
            } catch (e) {
                log.error(e);
                return false;
            }
        },

        /**
         * Refresh the features, fields and identities associated with a
         * disco entity by refetching them from the server
         * @method api.disco.refresh
         * @param {string} jid The JID of the entity whose features are refreshed.
         * @returns {Promise} A promise which resolves once the features have been refreshed
         * @example
         * await api.disco.refresh('room@conference.example.org');
         */
        async refresh(jid) {
            if (!jid) throw new TypeError('api.disco.refresh: You need to provide an entity JID');

            await api.waitUntil('discoInitialized');
            let entity = await api.disco.entities.get(jid);
            if (entity) {
                entity.features.reset();
                entity.fields.reset();
                entity.identities.reset();
                if (!entity.waitUntilFeaturesDiscovered.isPending) {
                    entity.waitUntilFeaturesDiscovered = getOpenPromise();
                }
                if (!entity.waitUntilItemsFetched.isPending) {
                    entity.waitUntilItemsFetched = getOpenPromise();
                }
                entity.queryInfo();
            } else {
                // Create it if it doesn't exist
                entity = await api.disco.entities.create({ jid }, { ignore_cache: true });
            }
            return entity.waitUntilItemsFetched;
        },

        /**
         * Return all the features associated with a disco entity
         *
         * @method api.disco.getFeatures
         * @param { string } jid The JID of the entity whose features are returned.
         * @returns {promise} A promise which resolves with the returned features
         * @example
         * const features = await api.disco.getFeatures('room@conference.example.org');
         */
        async getFeatures(jid) {
            if (!jid) throw new TypeError('api.disco.getFeatures: You need to provide an entity JID');

            await api.waitUntil('discoInitialized');
            let entity = await api.disco.entities.get(jid, true);
            entity = await entity.waitUntilFeaturesDiscovered;
            return entity.features;
        },

        /**
         * Return all the service discovery extensions fields
         * associated with an entity.
         *
         * See [XEP-0129: Service Discovery Extensions](https://xmpp.org/extensions/xep-0128.html)
         *
         * @method api.disco.getFields
         * @param { string } jid The JID of the entity whose fields are returned.
         * @example
         * const fields = await api.disco.getFields('room@conference.example.org');
         */
        async getFields(jid) {
            if (!jid) throw new TypeError('api.disco.getFields: You need to provide an entity JID');

            await api.waitUntil('discoInitialized');
            let entity = await api.disco.entities.get(jid, true);
            entity = await entity.waitUntilFeaturesDiscovered;
            return entity.fields;
        },

        /**
         * Get the identity (with the given category and type) for a given disco entity.
         *
         * For example, when determining support for PEP (personal eventing protocol), you
         * want to know whether the user's own JID has an identity with
         * `category='pubsub'` and `type='pep'` as explained in this section of
         * XEP-0163: https://xmpp.org/extensions/xep-0163.html#support
         *
         * @method api.disco.getIdentity
         * @param {string} category -The identity category.
         *     In the XML stanza, this is the `category`
         *     attribute of the `<identity>` element.
         *     For example: 'pubsub'
         * @param {string} type - The identity type.
         *     In the XML stanza, this is the `type`
         *     attribute of the `<identity>` element.
         *     For example: 'pep'
         * @param {string} jid - The JID of the entity which might have the identity
         * @returns {promise} A promise which resolves with a map indicating
         *     whether an identity with a given type is provided by the entity.
         * @example
         * api.disco.getIdentity('pubsub', 'pep', _converse.bare_jid).then(
         *     function (identity) {
         *         if (identity) {
         *             // The entity DOES have this identity
         *         } else {
         *             // The entity DOES NOT have this identity
         *         }
         *     }
         * ).catch(e => log.error(e));
         */
        async getIdentity(category, type, jid) {
            const e = await api.disco.entities.get(jid, true);
            if (e === undefined && !api.connection.connected()) {
                // Happens during tests when disco lookups happen asynchronously after teardown.
                const msg =
                    `Tried to look up category ${category} for ${jid} ` +
                    `but _converse.disco_entities has been torn down`;
                log.warn(msg);
                return;
            }
            return e.getIdentity(category, type);
        },
    },
};
