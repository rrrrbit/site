// 1. Create the template structure and scoped styling
const template = document.createElement('template');
template.innerHTML = `

    <style>
        .window {
            outline: 1px solid white;
            display: grid;
            grid-template-rows: auto 1fr;
            grid-template-columns: minmax(0, 1fr);
            max-height: inherit;
            min-height: 0;
        }

        .window-header {
            outline: 1px solid white;
            padding: var(--thinPadding);
        }

        .window-content {
            padding: var(--thinPadding);
            box-sizing: border-box;
            min-height: 0;
            max-width: 100%;
            max-height: 100%;
        }

        :host {
            display: block;
        }
    </style>


    <div class="window">
        <div class="window-header">
            <slot name="title">window</slot>
        </div>
        <div class="window-content">
            <slot name="content">
                content
            </slot>
        </div>
    </div>
`;

// 2. Define the behavior in a class extending HTMLElement
class CmpntWindow extends HTMLElement {
    constructor() {
        super(); // Always call super first
        
        // Attach a Shadow DOM to encapsulate styles and structure
        this.attachShadow({ mode: 'open' });
        
        // Clone and append the template content
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

// 3. Register the custom tag (must contain a hyphen)
customElements.define('window-', CmpntWindow);