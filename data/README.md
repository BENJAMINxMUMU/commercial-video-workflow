# data 目录

存放工作流变更事件 `events.json`（由服务端运行时生成）。
Render 免费 Web Service 的文件系统为临时存储，事件会在重新部署后重置；
如需长期持久化，建议后续接入 Render Disk 或外部数据库。
