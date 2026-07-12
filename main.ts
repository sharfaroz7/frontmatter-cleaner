import { App, Plugin, Modal, Notice, TFile } from "obsidian";

interface FrontmatterEntry {
	key: string;
	displayValue: string;
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

		this.entries = relevantKeys.map((key) => ({
			key,
			displayValue: this.formatValue(frontmatter![key]),
		}));

		const listEl = contentEl.createDiv({ cls: "fmc-list" });

		this.entries.forEach((entry) => {
			const row = listEl.createDiv({ cls: "fmc-row" });

			const checkbox = row.createEl("input", { type: "checkbox", cls: "fmc-checkbox" });
			checkbox.tabIndex = -1;

			const textWrap = row.createDiv({ cls: "fmc-text" });
			textWrap.createEl("span", { text: entry.key, cls: "fmc-key" });
			textWrap.createEl("span", { text: entry.displayValue, cls: "fmc-value" });

			// The entire row is the tap target, not just the checkbox.
			row.addEventListener("click", () => {
				checkbox.checked = !checkbox.checked;
				this.handleToggle(entry.key, checkbox.checked, row);
			});
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
		if (value === null || value === undefined) return "";
		if (Array.isArray(value)) {
			return value.map((v) => String(v)).join(", ");
		}
		if (typeof value === "object") {
			return JSON.stringify(value);
		}
		const str = String(value);
		return str.length > 60 ? str.slice(0, 57) + "..." : str;
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
	}
}
