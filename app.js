// =========================
// 設定區
// =========================
const OPENWEATHERMAP_API_KEY = "bd5e378503939ddaee76f12ad7a97608"; // 必填，圖層才會顯示
const CACHE_TTL = 10 * 60 * 1000;
const FAVORITES_KEY = "weatherdesk_favorites";
const RECENTS_KEY = "weatherdesk_recents";
const THEME_KEY = "weatherdesk_theme";
const CACHE_PREFIX = "weatherdesk_cache_";

// =========================
// DOM
// =========================
const cityInput = document.getElementById("cityInput");
const citySuggestions = document.getElementById("citySuggestions");
const searchBtn = document.getElementById("searchBtn");
const locateBtn = document.getElementById("locateBtn");
const saveFavoriteBtn = document.getElementById("saveFavoriteBtn");
const themeToggle = document.getElementById("themeToggle");
const statusText = document.getElementById("statusText");
const cacheBadge = document.getElementById("cacheBadge");
const currentPlaceMeta = document.getElementById("currentPlaceMeta");
const favoritesList = document.getElementById("favoritesList");
const recentList = document.getElementById("recentList");

const cityNameEl = document.getElementById("cityName");
const citySubtitleEl = document.getElementById("citySubtitle");
const weatherIconEl = document.getElementById("weatherIcon");
const currentTempEl = document.getElementById("currentTemp");
const currentDescEl = document.getElementById("currentDesc");
const apparentTempEl = document.getElementById("apparentTemp");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("windSpeed");
const windDirEl = document.getElementById("windDir");
const pressureEl = document.getElementById("pressure");
const uvCurrentEl = document.getElementById("uvCurrent");
const currentRainEl = document.getElementById("currentRain");
const aqiNowEl = document.getElementById("aqiNow");
const sunriseTextEl = document.getElementById("sunriseText");
const sunsetTextEl = document.getElementById("sunsetText");

const aqiBigEl = document.getElementById("aqiBig");
const aqiLabelEl = document.getElementById("aqiLabel");
const pm25El = document.getElementById("pm25");
const pm10El = document.getElementById("pm10");
const ozoneEl = document.getElementById("ozone");
const uvMaxEl = document.getElementById("uvMax");

const hourlyForecastEl = document.getElementById("hourlyForecast");
const dailyForecastEl = document.getElementById("dailyForecast");
const rainTimelineEl = document.getElementById("rainTimeline");
const radarMetaEl = document.getElementById("radarMeta");

const layerCloudsEl = document.getElementById("layerClouds");
const layerPrecipEl = document.getElementById("layerPrecip");
const layerTempEl = document.getElementById("layerTemp");
const layerWindEl = document.getElementById("layerWind");
const layerRadarEl = document.getElementById("layerRadar");
const radarPrevEl = document.getElementById("radarPrev");
const radarPlayEl = document.getElementById("radarPlay");
const radarNextEl = document.getElementById("radarNext");
const radarLatestEl = document.getElementById("radarLatest");

// =========================
// 狀態
// =========================
const state = {
  lastPlace: null,
  map: null,
  marker: null,
  overlays: {},
  radar: {
    frames: [],
    layers: [],
    currentIndex: 0,
    playing: false,
    timer: null
  },
  charts: {
    tempChart: null
  }
};

// =========================
// 工具
// =========================
const weatherCodeMap = {
  0: { text: "晴朗", icon: "☀️", theme: "theme-clear" },
  1: { text: "大致晴朗", icon: "🌤️", theme: "theme-clear" },
  2: { text: "局部多雲", icon: "⛅", theme: "theme-cloudy" },
  3: { text: "陰天", icon: "☁️", theme: "theme-cloudy" },
  45: { text: "霧", icon: "🌫️", theme: "theme-cloudy" },
  48: { text: "霧凇", icon: "🌫️", theme: "theme-cloudy" },
  51: { text: "毛毛雨", icon: "🌦️", theme: "theme-rain" },
  53: { text: "中度毛毛雨", icon: "🌦️", theme: "theme-rain" },
  55: { text: "強毛毛雨", icon: "🌧️", theme: "theme-rain" },
  56: { text: "凍毛毛雨", icon: "🌧️", theme: "theme-rain" },
  57: { text: "強凍毛毛雨", icon: "🌧️", theme: "theme-rain" },
  61: { text: "小雨", icon: "🌧️", theme: "theme-rain" },
  63: { text: "中雨", icon: "🌧️", theme: "theme-rain" },
  65: { text: "大雨", icon: "🌧️", theme: "theme-rain" },
  66: { text: "凍雨", icon: "🌧️", theme: "theme-rain" },
  67: { text: "強凍雨", icon: "🌧️", theme: "theme-rain" },
  71: { text: "小雪", icon: "🌨️", theme: "theme-cloudy" },
  73: { text: "中雪", icon: "🌨️", theme: "theme-cloudy" },
  75: { text: "大雪", icon: "❄️", theme: "theme-cloudy" },
  77: { text: "雪粒", icon: "❄️", theme: "theme-cloudy" },
  80: { text: "陣雨", icon: "🌦️", theme: "theme-rain" },
  81: { text: "較強陣雨", icon: "🌧️", theme: "theme-rain" },
  82: { text: "強烈陣雨", icon: "⛈️", theme: "theme-rain" },
  85: { text: "陣雪", icon: "🌨️", theme: "theme-cloudy" },
  86: { text: "強陣雪", icon: "❄️", theme: "theme-cloudy" },
  95: { text: "雷雨", icon: "⛈️", theme: "theme-rain" },
  96: { text: "雷雨夾冰雹", icon: "⛈️", theme: "theme-rain" },
  99: { text: "強雷雨夾冰雹", icon: "⛈️", theme: "theme-rain" }
};

function getWeatherInfo(code, isDay = 1) {
  const data = weatherCodeMap[code] || { text: "未知天氣", icon: "❔", theme: "theme-cloudy" };
  if (!isDay && [0, 1].includes(code)) {
    return { ...data, icon: "🌙", theme: "theme-night", text: "晴夜" };
  }
  return data;
}

function debounce(fn, wait = 500) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function formatHour(iso) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:00`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return `${d.getMonth() + 1}/${d.getDate()} ${weekdays[d.getDay()]}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatShortTime(iso) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function directionText(deg) {
  const dirs = ["北", "東北", "東", "東南", "南", "西南", "西", "西北"];
  return dirs[Math.round(deg / 45) % 8];
}

function aqiLabel(aqi) {
  if (aqi == null) return "無資料";
  if (aqi <= 50) return "良好";
  if (aqi <= 100) return "普通";
  if (aqi <= 150) return "對敏感族群不健康";
  if (aqi <= 200) return "不健康";
  if (aqi <= 300) return "非常不健康";
  return "危險";
}

function setStatus(text, cache = false) {
  statusText.textContent = text;
  cacheBadge.textContent = cache ? "快取資料" : "即時資料";
}

function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateBodyTheme(info, isDay) {
  document.body.classList.remove("theme-clear", "theme-cloudy", "theme-rain", "theme-night");
  if (!isDay) {
    document.body.classList.add("theme-night");
    return;
  }
  document.body.classList.add(info.theme || "theme-cloudy");
}

// =========================
// API
// =========================
const API = {
  async geocodeCity(query, count = 5) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=zh&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  },

  async fetchWeather(lat, lon, timezone = "auto") {
    const key = `${CACHE_PREFIX}${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = storageGet(key, null);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return { ...cached.payload, __fromCache: true };
    }

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day,pressure_msl` +
      `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum` +
      `&forecast_days=7&timezone=${timezone}`;

    const airUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=us_aqi,pm2_5,pm10,ozone&timezone=${timezone}`;

    const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
    const weather = await weatherRes.json();
    const air = await airRes.json();

    const payload = { weather, air };
    storageSet(key, { ts: Date.now(), payload });
    return { ...payload, __fromCache: false };
  },

  async reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=zh-TW,zh`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    const data = await res.json();
    return data;
  },

  async getRadarFrames() {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    return await res.json();
  }
};

// =========================
// 收藏 / 最近搜尋
// =========================
function renderFavorites() {
  const favorites = storageGet(FAVORITES_KEY, []);
  favoritesList.innerHTML = "";
  if (!favorites.length) {
    favoritesList.innerHTML = `<div class="mini-item">尚無收藏</div>`;
    return;
  }

  favorites.forEach(item => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `<span>${item.name}</span><span class="remove">×</span>`;
    tag.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove")) {
        removeFavorite(item.name);
      } else {
        loadByPlace(item);
      }
    });
    favoritesList.appendChild(tag);
  });
}

function saveFavorite() {
  if (!state.lastPlace) return;
  const favorites = storageGet(FAVORITES_KEY, []);
  const exists = favorites.some(f => f.name === state.lastPlace.name);
  if (!exists) {
    favorites.unshift(state.lastPlace);
    storageSet(FAVORITES_KEY, favorites.slice(0, 10));
    renderFavorites();
    setStatus(`已收藏：${state.lastPlace.name}`);
  }
}

function removeFavorite(name) {
  const favorites = storageGet(FAVORITES_KEY, []).filter(item => item.name !== name);
  storageSet(FAVORITES_KEY, favorites);
  renderFavorites();
}

function pushRecent(place) {
  const recents = storageGet(RECENTS_KEY, []).filter(item => item.name !== place.name);
  recents.unshift(place);
  storageSet(RECENTS_KEY, recents.slice(0, 8));
  renderRecents();
}

function renderRecents() {
  const recents = storageGet(RECENTS_KEY, []);
  recentList.innerHTML = "";
  if (!recents.length) {
    recentList.innerHTML = `<div class="mini-item">尚無紀錄</div>`;
    return;
  }
  recents.forEach(item => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = item.name;
    tag.addEventListener("click", () => loadByPlace(item));
    recentList.appendChild(tag);
  });
}

// =========================
// 搜尋建議
// =========================
const suggestCities = debounce(async () => {
  const q = cityInput.value.trim();
  if (q.length < 2) {
    citySuggestions.innerHTML = "";
    return;
  }
  try {
    const results = await API.geocodeCity(q, 5);
    citySuggestions.innerHTML = "";
    results.forEach(place => {
      const option = document.createElement("option");
      option.value = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
      citySuggestions.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
}, 500);

// =========================
// 地圖
// =========================
function ensureMap(lat = 25.033, lon = 121.565) {
  if (state.map) return;

  state.map = L.map("map", {
    zoomControl: true
  }).setView([lat, lon], 7);

  const base = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "&copy; Esri",
      className: "base-map",
      maxZoom: 18
    }
  ).addTo(state.map);

  state.overlays.base = base;

  state.overlays.clouds = L.tileLayer(
    `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`,
    {
      attribution: "&copy; OpenWeatherMap",
      opacity: 0.93,
      className: "cloud-layer",
      maxZoom: 19
    }
  );

  state.overlays.precip = L.tileLayer(
    `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`,
    {
      attribution: "&copy; OpenWeatherMap",
      opacity: 0.82,
      className: "precip-layer",
      maxZoom: 19
    }
  );

  state.overlays.temp = L.tileLayer(
    `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`,
    {
      attribution: "&copy; OpenWeatherMap",
      opacity: 0.72,
      className: "temp-layer",
      maxZoom: 19
    }
  );

  state.overlays.wind = L.tileLayer(
    `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`,
    {
      attribution: "&copy; OpenWeatherMap",
      opacity: 0.7,
      className: "wind-layer",
      maxZoom: 19
    }
  );

  if (OPENWEATHERMAP_API_KEY && OPENWEATHERMAP_API_KEY !== "YOUR_OPENWEATHERMAP_API_KEY") {
    state.overlays.clouds.addTo(state.map);
  }

  state.map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    setStatus(`地圖點選：${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    await loadByCoords(lat, lng, "地圖選取位置");
  });
}

function setMarker(lat, lon, title) {
  if (!state.map) return;
  state.map.setView([lat, lon], 8);
  if (state.marker) state.marker.remove();
  state.marker = L.marker([lat, lon]).addTo(state.map);
  state.marker.bindPopup(title).openPopup();
}

function setLayerVisible(layerName, visible) {
  const layer = state.overlays[layerName];
  if (!layer) return;
  const has = state.map.hasLayer(layer);
  if (visible && !has) layer.addTo(state.map);
  if (!visible && has) state.map.removeLayer(layer);
}

async function setupRadarLoop() {
  try {
    const data = await API.getRadarFrames();
    const frames = data.radar && data.radar.past ? data.radar.past : [];
    state.radar.frames = frames;
    radarMetaEl.textContent = frames.length
      ? `雷達資料 ${frames.length} 幀`
      : "目前沒有可用雷達幀";

    // 清理舊 layer
    state.radar.layers.forEach(layer => {
      if (state.map && state.map.hasLayer(layer)) state.map.removeLayer(layer);
    });
    state.radar.layers = [];

    frames.forEach(frame => {
      const url = `${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      const layer = L.tileLayer(url, {
        attribution: "&copy; RainViewer",
        opacity: 0,
        className: "radar-layer",
        maxZoom: 7
      });
      state.radar.layers.push(layer);
    });

    if (layerRadarEl.checked) {
      showRadarFrame(frames.length - 1);
    }
  } catch (err) {
    console.error(err);
    radarMetaEl.textContent = "雷達資料讀取失敗";
  }
}

function showRadarFrame(index) {
  const layers = state.radar.layers;
  if (!layers.length || !state.map) return;

  index = (index + layers.length) % layers.length;
  state.radar.currentIndex = index;

  layers.forEach((layer, i) => {
    if (!state.map.hasLayer(layer)) layer.addTo(state.map);
    layer.setOpacity(i === index ? 0.72 : 0);
  });

  const frame = state.radar.frames[index];
  radarMetaEl.textContent = `雷達幀：${new Date(frame.time * 1000).toLocaleTimeString()}`;
}

function stopRadar() {
  state.radar.playing = false;
  radarPlayEl.textContent = "播放";
  if (state.radar.timer) clearInterval(state.radar.timer);
  state.radar.timer = null;
}

function startRadar() {
  if (!state.radar.layers.length) return;
  state.radar.playing = true;
  radarPlayEl.textContent = "暫停";
  if (state.radar.timer) clearInterval(state.radar.timer);
  state.radar.timer = setInterval(() => {
    showRadarFrame(state.radar.currentIndex + 1);
  }, 900);
}

function toggleRadarLayer(visible) {
  if (!visible) {
    stopRadar();
    state.radar.layers.forEach(layer => {
      if (state.map.hasLayer(layer)) state.map.removeLayer(layer);
    });
    radarMetaEl.textContent = "雷達未啟用";
    return;
  }
  if (!state.radar.layers.length) {
    setupRadarLoop().then(() => {
      showRadarFrame(state.radar.layers.length - 1);
    });
    return;
  }
  showRadarFrame(state.radar.currentIndex || state.radar.layers.length - 1);
}

// =========================
// 渲染
// =========================
function renderPlaceMeta(place) {
  currentPlaceMeta.innerHTML = `
    <div class="mini-item">名稱：${place.name}</div>
    <div class="mini-item">座標：${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</div>
    <div class="mini-item">區域：${place.admin1 || "-"} / ${place.country || "-"}</div>
  `;
}

function renderCurrent(place, weather, air) {
  const current = weather.current;
  const daily = weather.daily;
  const info = getWeatherInfo(current.weather_code, current.is_day);

  cityNameEl.textContent = place.name;
  citySubtitleEl.textContent = [
    place.admin1 || "",
    place.country || "",
    `更新 ${formatDateTime(current.time)}`
  ].filter(Boolean).join(" ｜ ");

  weatherIconEl.textContent = info.icon;
  currentTempEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  currentDescEl.textContent = info.text;
  apparentTempEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
  windDirEl.textContent = `${directionText(current.wind_direction_10m)} (${current.wind_direction_10m}°)`;
  pressureEl.textContent = `${Math.round(current.pressure_msl)} hPa`;
  currentRainEl.textContent = `${current.precipitation} mm`;
  uvCurrentEl.textContent = weather.hourly.uv_index.find(v => v != null) ?? "--";
  sunriseTextEl.textContent = formatShortTime(daily.sunrise[0]);
  sunsetTextEl.textContent = formatShortTime(daily.sunset[0]);

  const aqi = air.current ? air.current.us_aqi : null;
  aqiNowEl.textContent = aqi ?? "--";
  aqiBigEl.textContent = aqi ?? "--";
  aqiLabelEl.textContent = aqiLabel(aqi);
  pm25El.textContent = air.current?.pm2_5 != null ? `${air.current.pm2_5} μg/m³` : "--";
  pm10El.textContent = air.current?.pm10 != null ? `${air.current.pm10} μg/m³` : "--";
  ozoneEl.textContent = air.current?.ozone != null ? `${air.current.ozone} μg/m³` : "--";
  uvMaxEl.textContent = daily.uv_index_max[0] ?? "--";

  updateBodyTheme(info, current.is_day);
}

function getNext12Hours(hourly) {
  const now = Date.now();
  const items = [];
  for (let i = 0; i < hourly.time.length; i++) {
    const ts = new Date(hourly.time[i]).getTime();
    if (ts >= now && items.length < 12) {
      items.push({
        time: hourly.time[i],
        temperature: hourly.temperature_2m[i],
        apparent: hourly.apparent_temperature[i],
        code: hourly.weather_code[i],
        precipProb: hourly.precipitation_probability[i],
        precip: hourly.precipitation[i],
        humidity: hourly.relative_humidity_2m[i],
        wind: hourly.wind_speed_10m[i],
        uv: hourly.uv_index[i]
      });
    }
  }
  return items;
}

function renderHourly(hourly) {
  const list = getNext12Hours(hourly);
  hourlyForecastEl.innerHTML = "";
  list.forEach(item => {
    const info = getWeatherInfo(item.code);
    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <div class="hour-top">
        <div class="hour-time">${formatHour(item.time)}</div>
        <div class="hour-icon">${info.icon}</div>
      </div>
      <div class="hour-temp">${Math.round(item.temperature)}°C</div>
      <div class="hour-desc">${info.text}</div>
      <div class="hour-meta">
        <div>體感 ${Math.round(item.apparent)}°C</div>
        <div>降雨機率 ${item.precipProb ?? 0}%</div>
        <div>降雨量 ${item.precip ?? 0} mm</div>
        <div>濕度 ${item.humidity}% ｜ UV ${item.uv ?? 0}</div>
      </div>
    `;
    hourlyForecastEl.appendChild(card);
  });
}

function renderTimeline(hourly) {
  const list = getNext12Hours(hourly);
  rainTimelineEl.innerHTML = "";
  list.forEach(item => {
    const info = getWeatherInfo(item.code);
    const node = document.createElement("div");
    node.className = "time-node" + ((item.precipProb || 0) >= 60 ? " heavy" : "");
    node.innerHTML = `
      <div class="t">${formatHour(item.time)}</div>
      <div class="i">${info.icon}</div>
      <div class="p">${info.text}</div>
      <div class="p">雨機率 ${item.precipProb ?? 0}%</div>
      <div class="p">${item.precip ?? 0} mm</div>
    `;
    rainTimelineEl.appendChild(node);
  });
}

function renderDaily(daily) {
  dailyForecastEl.innerHTML = "";
  for (let i = 0; i < daily.time.length; i++) {
    const info = getWeatherInfo(daily.weather_code[i], 1);
    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <div class="day-date">${formatDate(daily.time[i])}</div>
      <div class="day-weather">
        <span class="icon">${info.icon}</span>
        <span>${info.text}</span>
      </div>
      <div class="day-temp">最高 ${Math.round(daily.temperature_2m_max[i])}°C / 最低 ${Math.round(daily.temperature_2m_min[i])}°C</div>
      <div class="day-sun">
        日出 ${formatShortTime(daily.sunrise[i])}<br>
        日落 ${formatShortTime(daily.sunset[i])}<br>
        降雨機率 ${daily.precipitation_probability_max[i] ?? 0}% / 雨量 ${daily.precipitation_sum[i] ?? 0} mm
      </div>
    `;
    dailyForecastEl.appendChild(row);
  }
}

function renderChart(hourly) {
  const list = getNext12Hours(hourly);
  const labels = list.map(item => formatHour(item.time));
  const temps = list.map(item => item.temperature);
  const precipProb = list.map(item => item.precipProb ?? 0);

  const ctx = document.getElementById("tempChart").getContext("2d");
  if (state.charts.tempChart) {
    state.charts.tempChart.destroy();
  }

  state.charts.tempChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "line",
          label: "氣溫 °C",
          data: temps,
          yAxisID: "yTemp",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3
        },
        {
          type: "bar",
          label: "降雨機率 %",
          data: precipProb,
          yAxisID: "yRain",
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.body).getPropertyValue("--text").trim()
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue("--muted").trim()
          },
          grid: {
            color: "rgba(128,128,128,0.12)"
          }
        },
        yTemp: {
          type: "linear",
          position: "left",
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue("--muted").trim()
          },
          grid: {
            color: "rgba(128,128,128,0.12)"
          }
        },
        yRain: {
          type: "linear",
          position: "right",
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue("--muted").trim()
          }
        }
      }
    }
  });
}

// =========================
// 載入流程
// =========================
async function loadByPlace(place) {
  state.lastPlace = place;
  pushRecent(place);
  renderPlaceMeta(place);
  setStatus(`查詢 ${place.name} 中...`);
  ensureMap(place.latitude, place.longitude);
  setMarker(place.latitude, place.longitude, place.name);

  try {
    const { weather, air, __fromCache } = await API.fetchWeather(place.latitude, place.longitude);
    renderCurrent(place, weather, air);
    renderHourly(weather.hourly);
    renderTimeline(weather.hourly);
    renderDaily(weather.daily);
    renderChart(weather.hourly);

    setLayerVisible("clouds", layerCloudsEl.checked && hasOWMKey());
    setLayerVisible("precip", layerPrecipEl.checked && hasOWMKey());
    setLayerVisible("temp", layerTempEl.checked && hasOWMKey());
    setLayerVisible("wind", layerWindEl.checked && hasOWMKey());
    if (layerRadarEl.checked) toggleRadarLayer(true);

    setStatus(`完成：${place.name}`, __fromCache);
  } catch (err) {
    console.error(err);
    setStatus("查詢失敗");
    alert("天氣資料讀取失敗，請稍後再試。");
  }
}

async function loadByCoords(lat, lon, fallbackName = "目前位置") {
  let resolved = {
    name: fallbackName,
    latitude: lat,
    longitude: lon,
    admin1: "",
    country: ""
  };

  try {
    const rev = await API.reverseGeocode(lat, lon);
    const addr = rev.address || {};
    resolved.name = [
      addr.city || addr.town || addr.village || addr.county || fallbackName
    ].filter(Boolean)[0];
    resolved.admin1 = addr.state || "";
    resolved.country = addr.country || "";
  } catch (err) {
    console.warn("reverse geocode failed", err);
  }

  await loadByPlace(resolved);
}

async function searchCity() {
  const q = cityInput.value.trim();
  if (!q) return;
  setStatus(`搜尋城市：${q}`);
  try {
    const results = await API.geocodeCity(q, 1);
    if (!results.length) {
      alert("找不到這個城市。");
      setStatus("查無資料");
      return;
    }
    const p = results[0];
    const place = {
      name: [p.name, p.admin1, p.country].filter(Boolean).join(", "),
      latitude: p.latitude,
      longitude: p.longitude,
      admin1: p.admin1 || "",
      country: p.country || ""
    };
    await loadByPlace(place);
  } catch (err) {
    console.error(err);
    setStatus("搜尋失敗");
  }
}

function locateMe() {
  if (!navigator.geolocation) {
    alert("瀏覽器不支援定位。");
    return;
  }
  setStatus("定位中...");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await loadByCoords(pos.coords.latitude, pos.coords.longitude, "我的位置");
    },
    (err) => {
      console.error(err);
      alert("定位失敗，請檢查瀏覽器權限。");
      setStatus("定位失敗");
    },
    {
      enableHighAccuracy: true,
      timeout: 12000
    }
  );
}

function hasOWMKey() {
  return OPENWEATHERMAP_API_KEY && OPENWEATHERMAP_API_KEY !== "YOUR_OPENWEATHERMAP_API_KEY";
}

// =========================
// 主題
// =========================
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "淺色模式" : "深色模式";
  storageSet(THEME_KEY, theme);
  if (state.charts.tempChart) {
    const place = state.lastPlace;
    if (place) loadByPlace(place);
  }
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
}

// =========================
// 事件
// =========================
searchBtn.addEventListener("click", searchCity);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchCity();
});
cityInput.addEventListener("input", suggestCities);

locateBtn.addEventListener("click", locateMe);
saveFavoriteBtn.addEventListener("click", saveFavorite);
themeToggle.addEventListener("click", toggleTheme);

layerCloudsEl.addEventListener("change", () => setLayerVisible("clouds", layerCloudsEl.checked && hasOWMKey()));
layerPrecipEl.addEventListener("change", () => setLayerVisible("precip", layerPrecipEl.checked && hasOWMKey()));
layerTempEl.addEventListener("change", () => setLayerVisible("temp", layerTempEl.checked && hasOWMKey()));
layerWindEl.addEventListener("change", () => setLayerVisible("wind", layerWindEl.checked && hasOWMKey()));
layerRadarEl.addEventListener("change", () => toggleRadarLayer(layerRadarEl.checked));

radarPrevEl.addEventListener("click", () => {
  stopRadar();
  showRadarFrame(state.radar.currentIndex - 1);
});
radarNextEl.addEventListener("click", () => {
  stopRadar();
  showRadarFrame(state.radar.currentIndex + 1);
});
radarLatestEl.addEventListener("click", () => {
  stopRadar();
  showRadarFrame(state.radar.layers.length - 1);
});
radarPlayEl.addEventListener("click", () => {
  if (state.radar.playing) stopRadar();
  else {
    layerRadarEl.checked = true;
    toggleRadarLayer(true);
    startRadar();
  }
});

// =========================
// 初始化
// =========================
(function init() {
  renderFavorites();
  renderRecents();
  applyTheme(storageGet(THEME_KEY, "light"));
  ensureMap();
  setupRadarLoop();

  const favorites = storageGet(FAVORITES_KEY, []);
  const recents = storageGet(RECENTS_KEY, []);
  const initial = recents[0] || favorites[0] || {
    name: "Taipei, Taiwan",
    latitude: 25.033,
    longitude: 121.565,
    admin1: "Taipei",
    country: "Taiwan"
  };

  loadByPlace(initial);
})();