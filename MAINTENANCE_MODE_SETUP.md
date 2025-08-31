# 🚨 启用维护模式 - 立即指南

## ✅ **已完成的设置**

1. **✅ 维护模式组件已创建**:
   - `MaintenanceMode.tsx` - 美观的维护页面
   - `MaintenanceWrapper.tsx` - 智能包装器
   - **管理员可以绕过维护模式**

2. **✅ App.tsx已更新**: 包含维护模式包装器

## 🚀 **立即启用维护模式**

### **选项1: Vercel Dashboard (推荐用于生产)**

1. **进入 Vercel Dashboard**:
   - 访问: https://vercel.com/dashboard
   - 选择你的StoryMagic项目

2. **设置环境变量**:
   - 进入 **Settings → Environment Variables**
   - 添加新变量:
     ```
     Key: VITE_MAINTENANCE_MODE
     Value: true
     ```
   - 应用到: **Production, Preview, Development**

3. **重新部署**:
   - 进入 **Deployments** 页面
   - 点击最新部署的 **⋯** 菜单
   - 选择 **Redeploy**

### **选项2: 本地测试**

```bash
# 运行维护模式切换脚本
./toggle_maintenance.sh

# 或者手动创建 .env.local 文件
echo "VITE_MAINTENANCE_MODE=true" >> .env.local

# 启动开发服务器测试
npm run dev
```

---

## 🔧 **维护模式功能**

### **用户体验**:
- ⚠️ 显示友好的维护页面
- 🕒 预计时间说明 (15-30分钟)
- 💜 品牌一致的设计

### **管理员特权**:
- 🔑 **管理员可以绕过维护模式**
- 📱 显示"Continue as Admin"按钮
- 🚀 完全访问所有功能

### **自动检测**:
- 📡 基于环境变量 `VITE_MAINTENANCE_MODE`
- ⚡ 实时响应，无需代码更改

---

## 🎯 **快速操作**

### **立即启用维护模式**:
```bash
# Vercel CLI (如果已安装)
vercel env add VITE_MAINTENANCE_MODE true

# 或使用脚本
./toggle_maintenance.sh
```

### **关闭维护模式**:
在Vercel Dashboard中:
- 将 `VITE_MAINTENANCE_MODE` 设为 `false`
- 或删除该环境变量
- 重新部署

---

## 🔍 **验证维护模式**

### **检查步骤**:
1. **访问你的网站** - 应该看到维护页面
2. **管理员测试** - 登录后应该有绕过选项
3. **用户隔离** - 普通用户无法访问功能

### **预期界面**:
```
🔧 Maintenance Mode
System Temporarily Unavailable
⚠️ We're performing important updates
⏰ Expected duration: 15-30 minutes

[Continue as Admin] (仅管理员可见)
```

---

## 🚀 **生产部署清单**

- [ ] **Vercel环境变量**: `VITE_MAINTENANCE_MODE=true`
- [ ] **重新部署应用**
- [ ] **验证维护页面显示**
- [ ] **测试管理员绕过功能**
- [ ] **通知团队维护模式已启用**

---

**维护模式现在已准备就绪！设置 `VITE_MAINTENANCE_MODE=true` 即可立即启用。** 🎉