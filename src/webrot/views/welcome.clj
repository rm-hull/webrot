(ns webrot.views.welcome
  (:require [webrot.views.common :as common]
            [webrot.models.lut :as lut]
            [webrot.models.fractal :as frac])
  (:use [noir.core :only [defpage defpartial]]
        [noir.fetch.remotes :only [defremote]]
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

(defmulti to-number class)

(defmethod to-number Number [n]
  n)

(defmethod to-number :default [obj]
  (Integer/parseInt (str obj)))

(defn- default-lut [params]
  (assoc params :lut (get params :lut "Spectrum")))

(defn- default-size [params]
  (assoc params :size (get params :size "800,600")))

(defn- default-cutoff [params]
  (assoc params :cut-off (get params :cut-off "50")))

(defn- default-params 
  ([params] (default-params params frac/zoom-in))
  ([params zoom-fn]
    (let [params (-> params default-lut default-size default-cutoff)]
      (if (nil? (:x params))
        params
        (let [bounds (frac/to-bounds (parse-arg (:bounds params) [1 0.5 -1 -2]))
              screen (frac/to-bounds [0 800 600 0])
              newb   (zoom-fn 
                       bounds 
                       screen 
                       (to-number (:x params)) 
                       (to-number (:y params)))
              as-str (join "," (map #(% newb) [:top :right :bottom :left]))]
            (assoc params :bounds as-str))))))

(defpartial input-fields [{:keys [lut bounds size cut-off x y] :as params}]
  (hidden-field "bounds" bounds)
  (hidden-field "size" "800,600")
  (html
    [:div#control-ribbon
      (label "lut" "LUT:")
      (drop-down "lut" lut/available-luts lut)
      (label "cut-off" "Cut-off:")
      (drop-down "cut-off" (map str (range 50 1000 25)) cut-off)
      (submit-button "Refresh")]))

(defremote zoom-in [params]
  (default-params params frac/zoom-in))

(defpage [:any "/fractal-old"] {:as params}
  (let [params (default-params params)]
    (common/layout
      (form-to 
        [:post "/fractal-old"]
        (input-fields params)
        (html 
          [:div#fractal
            (html [:input {:type "image" :src (url "mandlebrot" params) }])])))))

(defpage [:any "/fractal"] {:as params}
  (let [params (default-params params)]
    (common/layout
      (form-to 
        [:post "/fractal"]
        (input-fields params))
      (html 
        [:div#fractal
          (link-to "#" (image (url "mandlebrot" params)))
          (common/spinner "container grey")]))))

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
