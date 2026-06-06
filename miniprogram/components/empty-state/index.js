Component({
  properties: {
    title: {
      type: String,
      value: ""
    },
    desc: {
      type: String,
      value: ""
    },
    icon: {
      type: String,
      value: ""
    },
    buttonText: {
      type: String,
      value: ""
    }
  },
  methods: {
    handleAction() {
      this.triggerEvent("action");
    }
  }
});
