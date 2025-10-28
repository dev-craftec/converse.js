import { html } from 'lit';
import { __ } from 'i18n';
import { showControlBox } from '../utils.js';

/**
 * @param {import('../toggle').default} el
 */
export default (el) => {
    let avatarUrl = null;
    if (localStorage.getItem('conversejs-session-jid')) {
        avatarUrl = localStorage.getItem('conversejs-avatar');
    }

    return html`<button
        type="button"
        class="btn toggle-controlbox ${el.model?.get('closed') ? '' : 'hidden'}"
        @click=${(ev) => showControlBox(ev)}
    >
        <span class="toggle-feedback">
            <span class="avatar align-self-center" height="32" width="32" name="You">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="avatar avatar align-self-center" 
                width="32" 
                height="32" 
                aria-label="Your profile picture"
              >
                <image 
                  preserveAspectRatio="xMidYMid meet" 
                  width="32" 
                  height="32" 
                  href="${avatarUrl}"
                ></image>
              </svg>
            </span>
            <span>${__('Messaging')}</span>
        </span>
    </button>`;
};
