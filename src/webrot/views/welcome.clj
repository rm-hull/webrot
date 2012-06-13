(ns webrot.views.welcome
  (:require [webrot.views.common :as common]
            [webrot.models.lut :as lut]
            [webrot.models.fractal :as frac])
  (:use [noir.core :only [defpage defpartial]]
        [hiccup.core :only [html]]
        [hiccup.form]
        [hiccup.element]
        [hiccup.util]
        [clojure.string :only [split join]])
  (:import [java.awt.image BufferedImage]))

(defn- parse-arg
  ([bounds] (parse-arg bounds nil))
  ([bounds defaults]
    (if (seq bounds)
      (map read-string (split bounds #","))
      defaults)))

(defn- zoom-in [params]
  (if (nil? (:x params))
    params
    (let [bounds (frac/to-bounds (parse-arg (:bounds params) [1 0.5 -1 -2]))
          screen (frac/to-bounds [0 800 600 0])
          newb   (frac/zoom-in bounds screen (read-string (:x params)) (read-string (:y params)))
          as-str (join "," (map #(% newb) [:top :right :bottom :left]))]
        (assoc params :bounds as-str))))

(defpartial input-fields [{:keys [lut bounds size cut-off x y] :as params}]
  (label "lut" "LUT:")
  (drop-down "lut" lut/available-luts lut)
  (label "cut-off" "Cut-off:")
  (drop-down "cut-off" (map str (range 50 301 25)) cut-off)
  (hidden-field "bounds" bounds)
  (hidden-field "size" "800,600")
  (html [:input {:type "image" :src (url "mandlebrot" params) }]))

(defpage [:any "/fractal"] {:as params}
  (common/layout
    (form-to [:post "/fractal"]
             (input-fields (zoom-in params))
             (submit-button "Refresh"))))

(defpage "/test/:lut" {:keys [lut]}
  (let [w 800
        h 600
        img (BufferedImage. w h BufferedImage/TYPE_INT_RGB)
        colors (lut/from-name lut)]
    (doseq [x (range w)
            y (range h)]
      (.setRGB img x y (lut/get-color colors y)))
    img))

(defpage "/mandlebrot" {:keys [lut bounds size cut-off]}
  (let [color-map (partial lut/get-color (lut/from-name lut))]
    (frac/fractal
      (parse-arg size [800 600])
      (frac/mandlebrot-set (parse-arg bounds [1 0.5 -1 -2]))
      (first (parse-arg cut-off [50]))
      color-map)))

(defpage "/julia" {:keys [lut bounds size cut-off]}
  (let [color-map (partial lut/get-color (lut/from-name lut))]
    (frac/fractal
      (parse-arg size [800 600])
      (frac/julia-set [-1.2311 -0.54320] (parse-arg bounds [1 1.5 -1 -1.5]))
      (first (parse-arg cut-off [50]))
      color-map)))
