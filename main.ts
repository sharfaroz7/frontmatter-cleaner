import { App, Plugin, Modal, Notice, TFile } from "obsidian";

interface FrontmatterEntry {
	key: string;
	displayValue: string;
	isEmpty: boolean;
}

interface RowRefs {
	row: HTMLElement;
	checkbox: HTMLInputElement;
}

export default class FrontmatterCleanerPlugin extends Plugin {
	async onload() {
		this.addRibbonIcon("list-checks", "Clean frontmatter properties", () => {
			this.openCleaner();
		});

		this.addCommand({
			id: "clean-frontmatter-properties",
			name: "Clean frontmatter properties of current file",
			callback: () => {
				this.openCleaner();
			},
		});
	}

	openCleaner() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice("No active file.");
			return;
		}
		new FrontmatterCleanerModal(this.app, file).open();
	}
}

class FrontmatterCleanerModal extends Modal {
	private file: TFile;
	private entries: FrontmatterEntry[] = [];
	private selected: Set<string> = new Set();
	private rowRefs: Map<string, RowRefs> = new Map();
	private deleteButton!: HTMLButtonElement;

	constructor(app: App, file: TFile) {
		super(app);
		this.file = file;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("fmc-modal");

		const cache = this.app.metadataCache.getFileCache(this.file);
		const frontmatter = cache?.frontmatter;

		contentEl.createEl("h2", { text: "Frontmatter properties" });
		contentEl.createEl("p", { text: this.file.basename, cls: "fmc-filename" });

		const relevantKeys = frontmatter
			? Object.keys(frontmatter).filter((k) => k !== "position")
			: [];

		if (relevantKeys.length === 0) {
			contentEl.createEl("p", {
				text: "No frontmatter properties found in this file.",
			});
			return;
		}

		this.entries = relevantKeys.map((key) => {
			const value = frontmatter![key];
			return {
				key,
				displayValue: this.formatValue(value),
				isEmpty: this.isEmptyValue(value),
			};
		});

		this.renderToolbar(contentEl);

		const listEl = contentEl.createDiv({ cls: "fmc-list" });

		this.entries.forEach((entry) => {
			const row = listEl.createDiv({ cls: "fmc-row" });

			const checkbox = row.createEl("input", { type: "checkbox", cls: "fmc-checkbox" });
			checkbox.tabIndex = -1;

			const textWrap = row.createDiv({ cls: "fmc-text" });
			const keyLine = textWrap.createDiv({ cls: "fmc-key-line" });
			keyLine.createEl("span", { text: entry.key, cls: "fmc-key" });
			if (entry.isEmpty) {
				keyLine.createEl("span", { text: "Empty", cls: "fmc-badge fmc-badge-empty" });
			}
			textWrap.createEl("span", { text: entry.displayValue, cls: "fmc-value" });

			// The entire row is the tap target, not just the checkbox.
			row.addEventListener("click", () => {
				checkbox.checked = !checkbox.checked;
				this.handleToggle(entry.key, checkbox.checked, row);
			});

			this.rowRefs.set(entry.key, { row, checkbox });
		});

		const footer = contentEl.createDiv({ cls: "fmc-footer" });

		const cancelButton = footer.createEl("button", { text: "Cancel", cls: "fmc-cancel" });
		cancelButton.addEventListener("click", () => this.close());

		this.deleteButton = footer.createEl("button", {
			text: "Delete selected (0)",
			cls: "fmc-delete mod-warning",
		});
		this.deleteButton.disabled = true;
		this.deleteButton.addEventListener("click", () => {
			void this.deleteSelected();
		});
	}

	private renderToolbar(contentEl: HTMLElement) {
		const emptyCount = this.entries.filter((e) => e.isEmpty).length;

		const toolbar = contentEl.createDiv({ cls: "fmc-toolbar" });

		const allBtn = toolbar.createEl("button", { text: "Select all", cls: "fmc-chip" });
		allBtn.addEventListener("click", () => this.applyBulkSelection(() => true));

		const noneBtn = toolbar.createEl("button", { text: "Select none", cls: "fmc-chip" });
		noneBtn.addEventListener("click", () => this.applyBulkSelection(() => false));

		const emptyBtn = toolbar.createEl("button", {
			text: `Empty (${emptyCount})`,
			cls: "fmc-chip",
		});
		emptyBtn.disabled = emptyCount === 0;
		emptyBtn.addEventListener("click", () => this.applyBulkSelection((e) => e.isEmpty));
	}

	private applyBulkSelection(predicate: (entry: FrontmatterEntry) => boolean) {
		this.entries.forEach((entry) => {
			const refs = this.rowRefs.get(entry.key);
			if (!refs) return;

			const shouldSelect = predicate(entry);
			refs.checkbox.checked = shouldSelect;

			if (shouldSelect) {
				this.selected.add(entry.key);
				refs.row.addClass("is-selected");
			} else {
				this.selected.delete(entry.key);
				refs.row.removeClass("is-selected");
			}
		});
		this.updateDeleteButton();
	}

	private handleToggle(key: string, checked: boolean, row: HTMLElement) {
		if (checked) {
			this.selected.add(key);
			row.addClass("is-selected");
		} else {
			this.selected.delete(key);
			row.removeClass("is-selected");
		}
		this.updateDeleteButton();
	}

	private updateDeleteButton() {
		const count = this.selected.size;
		this.deleteButton.textContent = `Delete selected (${count})`;
		this.deleteButton.disabled = count === 0;
	}

	private formatValue(value: unknown): string {
		if (value === null || value === undefined) return "(empty)";
		if (Array.isArray(value)) {
			if (value.length === 0) return "(empty list)";
			return value.map((v) => String(v)).join(", ");
		}
		if (typeof value === "object") {
			const keys = Object.keys(value as object);
			return keys.length === 0 ? "(empty)" : JSON.stringify(value);
		}
		const str = String(value);
		if (str.trim().length === 0) return "(empty)";
		return str.length > 60 ? str.slice(0, 57) + "..." : str;
	}

	private isEmptyValue(value: unknown): boolean {
		if (value === null || value === undefined) return true;
		if (typeof value === "string") return value.trim().length === 0;
		if (Array.isArray(value)) return value.length === 0;
		if (typeof value === "object") return Object.keys(value as object).length === 0;
		return false;
	}

	private async deleteSelected() {
		if (this.selected.size === 0) return;

		const keysToDelete = Array.from(this.selected);

		await this.app.fileManager.processFrontMatter(this.file, (fm: Record<string, unknown>) => {
			for (const key of keysToDelete) {
				delete fm[key];
			}
		});

		new Notice(
			`Deleted ${keysToDelete.length} propert${keysToDelete.length === 1 ? "y" : "ies"}.`
		);
		this.close();
	}

	onClose() {
		this.contentEl.empty();
		this.rowRefs.clear();
	}
}
