// ==UserScript==
// @name         AI Prompt Manager
// @namespace    https://github.com/insign/ai-prompt-manager
// @version      2025.02.18.1758
// @description  Easily create and edit AI prompts.
// DeepSeek Chat only for now.
// @author       Hélio <open@helio.me>
// @license      MIT
// @match        https://chat.deepseek.com/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// ==/UserScript==

(function() {
	'use strict';

	const MANAGER_ID = 'ds-prompt-manager';
	const BUTTON_ID = 'ds-prompt-button';
	const STORAGE_KEY = 'ds_prompts_v2';
	const CSS_THEME = '#4D6BFE';

	let prompts = [];

	async function initialize() {
		try {
			const storedPrompts = await GM.getValue(STORAGE_KEY, []);
			prompts = Array.isArray(storedPrompts) ? storedPrompts : [];
			createManagerButton();
			createPromptManager();
			setupEventListeners();
			refreshPromptList();
		} catch (error) {
			console.error('Initialization failed:', error);
		}
	}

	function createManagerButton() {
		if (document.getElementById(BUTTON_ID)) return;

		const btn = document.createElement('div');
		btn.id = BUTTON_ID;
		btn.innerHTML = '📋';
		Object.assign(btn.style, {
			position: 'fixed',
			bottom: '90px',
			right: '20px',
			width: '45px',
			height: '45px',
			background: CSS_THEME,
			color: 'white',
			borderRadius: '50%',
			cursor: 'pointer',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: '2147483647',
			fontSize: '24px',
			boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
		});

		document.body.appendChild(btn);
	}

	function createPromptManager() {
		if (document.getElementById(MANAGER_ID)) return;

		const mgr = document.createElement('div');
		mgr.id = MANAGER_ID;
		mgr.innerHTML = `
      <div class="header">Saved Prompts</div>
      <div class="prompt-list"></div>
      <button class="add-prompt">+ New Prompt</button>
    `;

		Object.assign(mgr.style, {
			position: 'fixed',
			bottom: '145px',
			right: '20px',
			background: 'white',
			borderRadius: '12px',
			boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
			padding: '16px',
			width: '300px',
			display: 'none',
			zIndex: '2147483647'
		});

		document.body.appendChild(mgr);
	}

	async function refreshPromptList() {
		const list = document.querySelector(`#${MANAGER_ID} .prompt-list`);
		if (!list) return;

		list.innerHTML = '';
		prompts.forEach((prompt, index) => {
			const item = document.createElement('div');
			item.className = 'prompt-item';
			item.innerHTML = `
        <span class="prompt-title">${prompt.title}</span>
        <div class="prompt-actions">
          <button class="edit-btn">✏️</button>
          <button class="delete-btn">🗑️</button>
        </div>
      `;

			item.querySelector('.delete-btn').addEventListener('click', (e) => {
				e.stopPropagation();
				deletePrompt(index);
			});

			item.querySelector('.edit-btn').addEventListener('click', (e) => {
				e.stopPropagation();
				editPrompt(index);
			});

			item.addEventListener('click', () => insertPrompt(prompt.content));

			list.appendChild(item);
		});
	}

	async function deletePrompt(index) {
		prompts.splice(index, 1);
		await GM.setValue(STORAGE_KEY, prompts);
		refreshPromptList();
	}

	async function editPrompt(index) {
		const prompt = prompts[index];
		const newTitle = prompt('Edit title:', prompt.title);
		if (newTitle === null) return;

		const newContent = prompt('Edit content:', prompt.content);
		if (newContent === null) return;

		prompts[index] = { title: newTitle, content: newContent };
		await GM.setValue(STORAGE_KEY, prompts);
		refreshPromptList();
	}

	async function insertPrompt(content) {
		const fakeInput = document.querySelector('.b13855df');
		const textarea = document.getElementById('chat-input');

		if (!fakeInput || !textarea) return;

		try {
			// Update React state
			const reactPropsKey = Object.keys(textarea).find(k => k.startsWith('__reactProps'));
			if (reactPropsKey) {
				const reactProps = textarea[reactPropsKey];
				if (reactProps?.onChange) {
					textarea.value = content + '\n\n' + textarea.value;
					reactProps.onChange({
						target: textarea,
						currentTarget: textarea,
						type: 'input'
					});
				}
			}

			// Update visible editor
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(fakeInput);
			range.collapse(false);
			selection.removeAllRanges();
			selection.addRange(range);
			document.execCommand('insertText', false, content + '\n\n');
		} catch (error) {
			console.error('Insertion failed:', error);
		}
	}

	function setupEventListeners() {
		// Toggle manager
		document.getElementById(BUTTON_ID).addEventListener('click', function(e) {
			e.stopImmediatePropagation();
			const mgr = document.getElementById(MANAGER_ID);
			mgr.style.display = mgr.style.display === 'none' ? 'block' : 'none';
		}, true);

		// Close manager
		document.addEventListener('click', function(e) {
			const mgr = document.getElementById(MANAGER_ID);
			if (mgr && !mgr.contains(e.target) && !e.target.closest(`#${BUTTON_ID}`)) {
				mgr.style.display = 'none';
			}
		}, true);

		// Add new prompt
		document.querySelector(`#${MANAGER_ID} .add-prompt`).addEventListener('click', async function(e) {
			e.stopImmediatePropagation();
			const title = prompt('Enter prompt title:');
			if (!title) return;
			const content = prompt('Enter prompt content:');
			if (!content) return;

			prompts.push({ title, content });
			await GM.setValue(STORAGE_KEY, prompts);
			refreshPromptList();
		}, true);
	}

	GM.addStyle(`
    #${MANAGER_ID} {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      border: 1px solid ${CSS_THEME}20;
      color: #1a1a1a;
    }

    #${MANAGER_ID} .prompt-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    #${MANAGER_ID} .prompt-item:hover {
      background: ${CSS_THEME}08;
    }

    #${MANAGER_ID} .header {
      font-weight: 600;
      color: ${CSS_THEME};
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${CSS_THEME}20;
    }

    #${MANAGER_ID} .add-prompt {
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      background: ${CSS_THEME};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    #${MANAGER_ID} .add-prompt:hover {
      opacity: 0.9;
    }

    .prompt-actions button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      margin-left: 8px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .prompt-actions button:hover {
      opacity: 1;
    }
  `);

	// Initialize after slight delay to ensure DOM is ready
	setTimeout(initialize, 1000);
})();
