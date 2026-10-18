import type { LinkHandle } from "../../src/storage";

/** Fichier simulé : contenu, date de modification, permission. */
export class FakeHandle implements LinkHandle {
  content = "";
  lastModified = 1000;
  writes = 0;
  constructor(
    readonly name = "kakita.json",
    public permission: PermissionState = "granted",
    public onRequest: PermissionState = "granted",
  ) {}
  async getFile() {
    return { text: async () => this.content, lastModified: this.lastModified };
  }
  async createWritable() {
    if (this.permission !== "granted") throw new DOMException("Refusé", "NotAllowedError");
    let buffer = "";
    return {
      write: async (data: string) => { buffer += data; },
      close: async () => { this.content = buffer; this.lastModified += 1; this.writes += 1; },
    };
  }
  async queryPermission() {
    return this.permission;
  }
  async requestPermission() {
    this.permission = this.onRequest;
    return this.permission;
  }
  /** Modification par un autre programme (synchro Drive…). */
  touchElsewhere(content: string) {
    this.content = content;
    this.lastModified += 100;
  }
}

