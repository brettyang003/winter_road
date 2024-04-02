  import {useEffect,useRef, useState} from 'react';

  import { Modal } from "react-bootstrap";
  import "bootstrap/dist/css/bootstrap.min.css";
  import { loadModules } from "esri-loader";
  import "./styles.css"
  import {
    mapLinks,
    northWestCoordinates,
    nunavutCoordinates,
    yukonCoordinates,
  } from "./Data.js";

  function WeatherMap() {
    
    // References for DOM elements and data
    const weatherData = useRef(null);
    const MapElement = useRef(null);
    const [territory, setTerritory] = useState(null);
    const [key, setKey] = useState(null);

    // State to control modal visibility
    const [modalIsOpen, setModalIsOpen] = useState(false);

    /**
     * Effect hook to load data when component mounts.
     */
    useEffect(() => {
      loadData(weatherData, MapElement);
    }, []);

    /**
     * Function to close the modal.
     */
    function closeModal() {
      setModalIsOpen(false);
    }

    return (
      <div style={{ height: "84vh", border: "none" }} ref={MapElement}>
        <div id="legend-container"></div>
        <div id="layer-list-container"></div>

        <Modal
          show={modalIsOpen}
          onHide={closeModal}
          size="lg"
          dialogClassName="right-half-modal"
          end
        >
          <Modal.Header closeButton>
            <Modal.Title> Weather</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <iframe
              title="Environment Canada Weather"
              width="450"
              height="285"
              src={`https://weather.gc.ca/wxlink/wxlink.html?cityCode=${territory}-${key}&amp;lang=e`}
              allowtransparency="true"
            ></iframe>
          </Modal.Body>
        </Modal>
      </div>
    );
    /**
     * Function to load map data using ArcGIS API.
     * @param {object} weatherData - Reference to weather data.
     * @param {object} MapElement - Reference to map container element.
     * @param {string} mapType - Type of map (e.g., "arcgis-topographic").
     */

    function loadData(weatherData, MapElement, mapType = "arcgis-topographic") {
      loadModules(
        [
          "esri/views/MapView",
          "esri/layers/FeatureLayer",
          "esri/layers/GraphicsLayer",
          "esri/Map",
          "esri/config",
          "esri/Graphic",
          "esri/widgets/Popup",
          "esri/PopupTemplate",
          "esri/widgets/LayerList",
          "esri/widgets/Legend",
          "esri/widgets/Expand",
          "esri/widgets/Zoom",
          "esri/widgets/Zoom/ZoomViewModel",
        ],
        {
          css: true,
        }
      ).then(
        ([
          MapView,
          FeatureLayer,
          GraphicsLayer,
          Map,
          esriConfig,
          Graphic,
          Popup,
          PopupTemplate,
          LayerList,
          Legend,
          Expand,
          Zoom,
          ZoomViewModel,
        ]) => {
          esriConfig.apiKey =
            "AAPK523b3670e87d4504aa86c87ef22885f8B2U9Y_GAGwSmQV3HOq8d7NqRWn09tIR1BIMKvA6lf3581mq2wW2RuKOxPy75ccle";

          const map = new Map({ basemap: mapType });
          const view = new MapView({
            container: MapElement.current,
            map: map,
            center: [-110, 68.027],
            zoom: 4.5,
          });

          // Create layer list and legend widgets
          const layerList = new LayerList({
            view,
            container: "layer-list-container",
          });
          const legend = new Legend({ view, container: "legend-container" });

          // Add expand widgets for layer list and legend
          const layerListExpand = new Expand({
            content: layerList.domNode,
            view,
            expanded: false,
            expandIconClass: "custom-layerlist-icon",
          });
          const legendExpand = new Expand({
            content: legend.domNode,
            view,
            expanded: true,
            expandIconClass: "custom-legend-icon",
          });

          // Add custom zoom button
          const customZoomButton = document.createElement("div");
          customZoomButton.innerHTML = "🏠";
          customZoomButton.classList.add(
            "esri-widget",
            "esri-widget--button",
            "esri-widget--icon",
            "esri-zoom__custom-button"
          );

          customZoomButton.addEventListener("click", () => {
            view.goTo({ center: [-110, 68.027], zoom: 4.5 });
          });

          view.ui.add(customZoomButton, "top-left");

          /**
           * Creates a graphic representing a city on the map. Also contains a click event that triggers a modal when that city is clicked
           * @param {number[]} coordinates - Array containing latitude and longitude of the city.
           * @param {string} color - Color of the marker representing the city.
           * @param {GraphicsLayer} layer - Graphics layer where the city graphic will be added.
           */
          async function createCityGraphic(coordinates, color, layer) {
            const pinCoordinates = {
              type: "point",
              longitude: coordinates[1],
              latitude: coordinates[0],
            };

            let newPointGraphic = new Graphic({
              symbol: {
                type: "simple-marker",
                color: color,
                size: "5px",
              },
              geometry: pinCoordinates,
              attributes: {
                cityName: "City Name",
                weatherDetails: "Weather Details",
              },
            });
            liveWeatherDataLayer.add(newPointGraphic);

            //click event that triggers when a point on the map is clicked and checks to see if the point clicked contains any point located in the three territories
            view.on("click", (event) => {
              let uniqueKey = -1,
                territory = null;
              const clickedPoint = event.mapPoint;
              const latitude = clickedPoint.latitude,
                longitude = clickedPoint.longitude;

              // Checks if area clicked is a point located at a lat/long point in yukonCoordinates
              Object.keys(yukonCoordinates).every((yukonKey) => {
                if (
                  isWithinRange(
                    yukonCoordinates[yukonKey][1],
                    longitude - 0.07,
                    longitude + 0.07
                  ) &&
                  isWithinRange(
                    yukonCoordinates[yukonKey][0],
                    latitude - 0.07,
                    latitude + 0.07
                  )
                ) {
                  uniqueKey = yukonKey;
                  territory = "yt";
                  return false;
                }
                return true;
              });

              // Checks if area clicked is a point located at a lat/long point in northWestCoordinates
              Object.keys(northWestCoordinates).every((northKey) => {
                if (northKey === 1 || northKey === 24) {
                  if (
                    isWithinRange(
                      northWestCoordinates[northKey][1],
                      longitude - 0.01,
                      longitude + 0.01
                    ) &&
                    isWithinRange(
                      northWestCoordinates[northKey][0],
                      latitude - 0.01,
                      latitude + 0.01
                    )
                  ) {
                    uniqueKey = northKey;
                    territory = "nt";
                    return false;
                  }
                } else if (
                  isWithinRange(
                    northWestCoordinates[northKey][1],
                    longitude - 0.07,
                    longitude + 0.07
                  ) &&
                  isWithinRange(
                    northWestCoordinates[northKey][0],
                    latitude - 0.07,
                    latitude + 0.07
                  )
                ) {
                  uniqueKey = northKey;
                  territory = "nt";
                  return false;
                }
                return true;
              });

              // Checks if area clicked is a point located at a lat/long point in nunavutCoordinates
              Object.keys(nunavutCoordinates).every((nunavutKey) => {
                if (
                  isWithinRange(
                    nunavutCoordinates[nunavutKey][1],
                    longitude - 0.07,
                    longitude + 0.07
                  ) &&
                  isWithinRange(
                    nunavutCoordinates[nunavutKey][0],
                    latitude - 0.07,
                    latitude + 0.07
                  )
                ) {
                  uniqueKey = nunavutKey;
                  territory = "nu";
                  return false;
                }
                return true;
              });
              setKey((prevKey) => uniqueKey);
              setTerritory((prevTerritory) => territory);
              setModalIsOpen(true);
              if (territory == null) {
                setModalIsOpen(false);
              }
            });
          }

          //adds the feature layers from the ArcGIS web map. Certain layers are hidden via the featureLayer.visible parameter
          mapLinks.forEach((link, index) => {
            const featureLayer = new FeatureLayer({
              url: link,
            });

            // Set visibility for specific indices
            if (index === 0 || index === 4 || index === 7) {
              featureLayer.visible = false;
            }

            // featureLayer.featureReduction = {
            //   type: "cluster",
            // };

            map.add(featureLayer);
          });

          view.ui.add(layerListExpand, "top-left");
          view.ui.add(legendExpand, "top-right");

          //adds the live weather data from the GeoMet API for towns in the three territories
          const liveWeatherDataLayer = new GraphicsLayer({
            title: "Live Weather Data",
            featureReduction: {
              type: "cluster",
            },
          });

          Object.keys(yukonCoordinates).forEach((key) => {
            createCityGraphic(
              yukonCoordinates[key],
              "blue",
              liveWeatherDataLayer
            );
          });

          Object.keys(northWestCoordinates).forEach((key) => {
            createCityGraphic(
              northWestCoordinates[key],
              "blue",
              liveWeatherDataLayer
            );
          });
          Object.keys(nunavutCoordinates).forEach((key) => {
            createCityGraphic(
              nunavutCoordinates[key],
              "blue",
              liveWeatherDataLayer
            );
          });
          map.add(liveWeatherDataLayer);
        }
      );
    }

    function isWithinRange(number, min, max) {
      return number >= min && number <= max;
    }
  }


  export default WeatherMap;
