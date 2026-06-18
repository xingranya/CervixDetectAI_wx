Page({
  data: {
    drawerVisible: false,
    popupVisible: false,
    overlayVisible: false,
    calendarVisible: false,
    cascaderVisible: false,
    pickerVisible: false,
    dateTimeVisible: false,
    imageViewerVisible: false,
    actionSheetVisible: false,
    dialogVisible: false,
    guideVisible: false,
    sideValue: 0,
    tabValue: "tools",
    tabBarValue: "assistant",
    segmentedValue: "today",
    segmentedOptions: [
      { label: "今日", value: "today" },
      { label: "本周", value: "week" },
      { label: "本月", value: "month" }
    ],
    switchValue: true,
    sliderValue: 62,
    stepperValue: 2,
    rateValue: 4,
    radioValue: "science",
    checkboxValue: ["record", "remind"],
    colorValue: "#2f7cf6",
    inputValue: "复查准备",
    textareaValue: "记录想咨询医生的问题、检查日期和症状变化。",
    searchValue: "",
    dateValue: "",
    pickerValue: ["review"],
    pickerColumns: [[
      { value: "review", label: "复查准备" },
      { value: "record", label: "健康记录" }
    ]],
    cascaderValue: [],
    cascaderOptions: [
      {
        label: "健康科普",
        value: "health",
        children: [
          { label: "筛查常识", value: "screening" },
          { label: "复查准备", value: "review" }
        ]
      }
    ],
    treeValue: "screening",
    treeOptions: [
      { label: "筛查知识", value: "screening" },
      { label: "复查准备", value: "review" },
      { label: "健康记录", value: "record" }
    ],
    collapseValue: ["guide"],
    uploadFiles: [],
    uploadMediaType: ["image"],
    progress: 68,
    countdownTime: 3 * 60 * 60 * 1000,
    swiperList: [
      "https://tdesign.gtimg.com/mobile/demos/swiper1.png",
      "https://tdesign.gtimg.com/mobile/demos/swiper2.png"
    ],
    swiperNavigation: { type: "dots" },
    imageList: ["https://tdesign.gtimg.com/mobile/demos/example2.png"],
    imagePreview: "https://tdesign.gtimg.com/mobile/demos/example2.png",
    dropdownValue: "review",
    dropdownOptions: [
      { value: "review", label: "复查准备" },
      { value: "record", label: "健康记录" }
    ],
    tableColumns: [
      { colKey: "item", title: "事项", width: 96 },
      { colKey: "status", title: "状态", width: 96 },
      { colKey: "note", title: "说明", width: 160 }
    ],
    tableData: [
      { id: 1, item: "记录", status: "已完成", note: "症状与时间" },
      { id: 2, item: "复查", status: "待确认", note: "预约日期" }
    ],
    indexList: ["A", "B"],
    qrcodeValue: "https://tdesign.tencent.com/miniprogram/overview",
    skeletonRowCol: [1, 1, { width: "60%" }],
    actionSheetItems: [
      { label: "整理复查问题" },
      { label: "记录筛查日期" }
    ],
    guideSteps: [
      {
        mode: "dialog",
        title: "助手工具面板",
        body: "这里集中管理健康记录、复查准备和组件能力。"
      }
    ]
  },

  setValue(event) {
    const field = event.currentTarget.dataset.field;
    if (!field) return;
    const detail = event.detail || {};
    const value = detail.value !== undefined
      ? detail.value
      : (detail.current !== undefined ? detail.current : detail);
    this.setData({ [field]: value });
  },

  open(event) {
    const field = event.currentTarget.dataset.field;
    if (field) this.setData({ [field]: true });
  },

  close(event) {
    const field = event.currentTarget.dataset.field;
    if (field) this.setData({ [field]: false });
  },

  onPickerConfirm(event) {
    this.setData({
      pickerValue: event.detail && event.detail.value || [],
      pickerVisible: false
    });
  },

  onDateConfirm(event) {
    this.setData({
      dateValue: event.detail && event.detail.value || "",
      dateTimeVisible: false
    });
  },

  onCalendarConfirm(event) {
    this.setData({
      dateValue: event.detail && event.detail.value || "",
      calendarVisible: false
    });
  },

  onCascaderChange(event) {
    this.setData({
      cascaderValue: event.detail && event.detail.value || [],
      cascaderVisible: false
    });
  },

  onUploadSelect(event) {
    const detail = event.detail || {};
    const files = []
      .concat(Array.isArray(detail.files) ? detail.files : [])
      .concat(Array.isArray(detail.currentSelectedFiles) ? detail.currentSelectedFiles : [])
      .flat()
      .map((item) => {
        if (!item) return null;
        const url = item.url || item.tempFilePath || item.path || "";
        return url ? { ...item, url } : null;
      })
      .filter(Boolean)
      .slice(0, 3);
    this.setData({ uploadFiles: files });
  }
});
