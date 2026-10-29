// Editor d'expressions basat en tokens: l'esborrat treu "sin(" sencer
// i el cursor es mou per tokens, cosa que fa l'edició còmoda al mòbil.

export class Editor {
  constructor() {
    this.tokens = [];
    this.caret = 0;
  }

  get text() {
    return this.tokens.join('');
  }

  get isEmpty() {
    return this.tokens.length === 0;
  }

  insert(...toks) {
    this.tokens.splice(this.caret, 0, ...toks);
    this.caret += toks.length;
  }

  backspace() {
    if (this.caret === 0) return;
    this.tokens.splice(this.caret - 1, 1);
    this.caret--;
  }

  clear() {
    this.tokens = [];
    this.caret = 0;
  }

  load(tokens) {
    this.tokens = tokens.slice();
    this.caret = this.tokens.length;
  }

  move(delta) {
    this.setCaret(this.caret + delta);
  }

  setCaret(i) {
    this.caret = Math.max(0, Math.min(this.tokens.length, i));
  }
}
