import { loadModules } from "esri-loader";
import { useEffect, useRef } from "react";

export default function loadData(weatherData,MapElement) {
  loadModules(
    [
      "esri/views/MapView",
      "esri/layers/GraphicsLayer",
      "esri/Map",
      "esri/config",
      "esri/Graphic",
      "esri/widgets/Popup",
      "esri/PopupTemplate",
    ],
    {
      css: true,
    }
  ).then(([MapView, GraphicsLayer, Map, esriConfig, Graphic, Popup, PopupTemplate]) => {
    esriConfig.apiKey =
      "AAPK523b3670e87d4504aa86c87ef22885f8B2U9Y_GAGwSmQV3HOq8d7NqRWn09tIR1BIMKvA6lf3581mq2wW2RuKOxPy75ccle";
    const map = new Map({ basemap: "arcgis-topographic" });
    const view = new MapView({
      container: MapElement.current,
      map: map,
      center: [-90, 45.027],
      zoom: 4,
    });

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
    let url = `https://api.weather.gc.ca/collections/swob-realtime/items?&f=json`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        let airTemperature;
        let newPointGraphic;
        weatherData.current = data.features;
         const popupTemplate = new PopupTemplate({
           title: "Station X",
           content: "<b>Air Temperature:</b> {airTemperature}",
         });
        weatherData.current.forEach((item) => {
          let coordinates = {
            type: "point",
            longitude: item.geometry.coordinates[0],
            latitude: item.geometry.coordinates[1],
          };
          newPointGraphic = new Graphic({
            symbol: {
              type: "simple-marker",
              color: "red",
              size: "5px",
            },
            geometry: coordinates,
            attributes: {
              name: "New Point",
              type: "Sample",
            },
            popupTemplate: popupTemplate,
          });

          graphicsLayer.add(newPointGraphic);
        });
        view.popup = new Popup({ view: view });
        view.on("click", (event) => {
          const clickedPoint = event.mapPoint;
          const latitude = clickedPoint.latitude,
            longitude = clickedPoint.longitude;
          weatherData.current.forEach((item) => {
            if (
              isWithinRange(
                item.geometry.coordinates[0],
                longitude - 2,
                longitude + 2
              ) &&
              isWithinRange(
                item.geometry.coordinates[1],
                latitude - 2,
                latitude + 2
              )
            ) {
              airTemperature = item.properties.air_temp;
              newPointGraphic.popupTemplate.title = `Weather Details at ${
                item.properties["stn_nam-value"]}`;
              newPointGraphic.popupTemplate.content = `<b>Air Temperature:</b> ${airTemperature} °C `;
            }
          });
        });
      });
  });
}

function isWithinRange(number, min, max) {
  return number >= min && number <= max;
}