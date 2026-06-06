const home = {
  userName: "张女士",
  latestTitle: "最近一次健康检查摘要",
  latestDate: "2026-03-18",
  latestSummary: "已记录本次检查项目、摘要和复查提醒，建议按计划管理后续安排。",
  nextReminder: "2026-09-18 前完成复查提醒",
  disclaimer: "本小程序仅用于健康信息记录与提醒，具体健康问题请前往线下正规机构咨询。",
  metrics: [
    { label: "已记录", value: "2 次" },
    { label: "待关注", value: "1 项" },
    { label: "下次提醒", value: "9 月前" }
  ],
  steps: [
    { title: "核对摘要", desc: "确认日期、项目和记录内容是否准确。" },
    { title: "设置提醒", desc: "把复查计划放进提醒列表，减少遗忘。" },
    { title: "整理问题", desc: "线下咨询前先列出想确认的重点。" }
  ]
};

const records = [
  {
    id: "r20260318",
    date: "2026-03-18",
    title: "女性健康筛查记录",
    project: "TCT / HPV 摘要记录",
    summary: "本次记录提示需要持续关注后续复查安排。",
    suggestion: "建议按原记录中的时间管理复查安排。",
    status: "待复查"
  },
  {
    id: "r20260115",
    date: "2026-01-15",
    title: "健康检查记录",
    project: "HPV 摘要记录",
    summary: "已记录检查摘要，便于后续就诊时查看。",
    suggestion: "建议保留历史记录，后续咨询时一并出示。",
    status: "已记录"
  }
];

let reminders = [
  {
    id: "m1",
    title: "复查提醒",
    date: "2026-09-18",
    desc: "建议在计划时间前完成复查安排。",
    done: false
  },
  {
    id: "m2",
    title: "资料准备",
    date: "2026-09-10",
    desc: "就诊前准备近期检查摘要和想咨询的问题。",
    done: false
  }
];

const questionTemplates = [
  "这次检查摘要里，我需要重点留意哪些信息？",
  "复查前需要准备哪些资料？",
  "历史记录需要一起带去吗？",
  "如果近期身体不适，我应该如何安排线下咨询？"
];

const articles = [
  {
    id: "a1",
    title: "如何整理一次健康检查记录",
    summary: "把日期、项目、摘要、提醒和问题清单放在一起，复查时更容易沟通。"
  },
  {
    id: "a2",
    title: "复查提醒为什么重要",
    summary: "固定提醒可以减少遗忘，帮助自己按计划完成健康管理。"
  }
];

function getRecordById(id) {
  return records.find((item) => item.id === id);
}

function completeReminder(id) {
  reminders = reminders.map((item) => (item.id === id ? { ...item, done: true } : item));
  return reminders.find((item) => item.id === id);
}

function createReminder(reminder) {
  reminders = [reminder, ...reminders];
  return reminder;
}

function updateReminder(id, payload) {
  reminders = reminders.map((item) => (item.id === id ? { ...item, ...payload } : item));
  return reminders.find((item) => item.id === id);
}

function deleteReminder(id) {
  reminders = reminders.filter((item) => item.id !== id);
  return { deleted: true };
}

module.exports = {
  home,
  records,
  reminders: () => reminders,
  questionTemplates,
  articles,
  getRecordById,
  completeReminder,
  createReminder,
  updateReminder,
  deleteReminder
};
