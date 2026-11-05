# 图像素材署名

插件中的 10 张天体照片来自 ESA/Hubble 官方图库，按 Creative Commons Attribution 4.0（CC BY 4.0）授权使用。

**署名：ESA/Hubble & NASA**

授权条款：https://creativecommons.org/licenses/by/4.0/

## 使用方式

- 原图（「screen」尺寸，约 1280 px 宽）保存在 `assets-src/hubble/`，只作为构建素材，不随插件分发。
- `scripts/build-photo-atlas.mjs` 对原图做了以下修改：
  - 裁剪到天体主体；
  - 缩小到不超过 256 px；
  - 去除照片自带的点状亮星；
  - 根据亮度生成透明通道，加柔和的椭圆边缘淡出；
  - 打包成一张 1024 × 768 的 WebP 图集（`src/render/photo-atlas.mjs`，内嵌在插件中）。
- 运行时不访问任何外部地址。
- 照片只作为远处的平面天体，随天空带漂移；不用于星云穿越。
- 画质降到最低档时改用程序化绘制的版本。
- 插件设置的「兼容性与状态」页显示署名和图像编号。

## 清单

| 编号 | 天体 | 原始地址 | 插件中的用途 |
|---|---|---|---|
| heic1501a | 创生之柱（鹰状星云 M16） | https://esahubble.org/images/heic1501a/ | 替换程序版「创生之柱 M16」 |
| heic0506a | 涡状星系 M51 及伴星系 | https://esahubble.org/images/heic0506a/ | 替换程序版「涡状星系 M51」 |
| opo0328a | 草帽星系 M104 | https://esahubble.org/images/opo0328a/ | 替换程序版「草帽星系 M104」 |
| heic0515a | 蟹状星云 M1 | https://esahubble.org/images/heic0515a/ | 替换程序版「蟹状星云 M1」 |
| heic0707a | 船底座星云 | https://esahubble.org/images/heic0707a/ | 新增天体 |
| heic0601a | 猎户座大星云 M42 | https://esahubble.org/images/heic0601a/ | 替换程序版「猎户座大星云 M42」 |
| heic0414a | 猫眼星云 NGC 6543 | https://esahubble.org/images/heic0414a/ | 替换程序版「猫眼星云 NGC 6543」 |
| heic0615a | 触须星系 NGC 4038/4039 | https://esahubble.org/images/heic0615a/ | 替换程序版「触须星系 NGC 4038/9」 |
| heic0711a | 星暴星系 NGC 4449 | https://esahubble.org/images/heic0711a/ | 新增天体 |
| heic0910h | 蝴蝶星云 NGC 6302 | https://esahubble.org/images/heic0910h/ | 替换程序版「蝴蝶星云 NGC 6302」 |

下载的文件地址格式为 `https://esahubble.org/media/archives/images/screen/<编号>.jpg`，下载日期 2026-11-04。
