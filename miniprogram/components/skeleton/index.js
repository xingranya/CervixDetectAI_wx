Component({
  properties: {
    mode: { type: String, value: "default" },
    rows: { type: Number, value: 3 }
  },
  data: { rowList: [0, 1, 2] },
  observers: {
    rows(val) {
      this.setData({ rowList: Array.from({ length: val }, (_, i) => i) });
    }
  }
});
