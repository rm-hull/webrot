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
(defmethod to-number Number [n] n)
(defmethod to-number :default [obj] (Integer/parseInt (str obj)))

(defn- default-type [params]
  (assoc params :type (get params :type "mandlebrot")))

(defn- defaults [params]
  (let [defaults {:lut "Spectrum"
                  :type "mandlebrot"
                  :bounds "1,0.5,-1,-2"
                  :cut-off 50
                  :size "800,600"
                  :x 400 :y 300}]
    (merge defaults params)))

(defn- process-params 
  ([params] (process-params params (fn [& args] (first args))))
  ([params zoom-fn]
    (let [params (defaults params)
          bounds (frac/to-bounds (parse-arg (:bounds params)))
          screen (frac/to-bounds [0 800 600 0])
          newb   (zoom-fn 
                   bounds 
                   screen 
                   (to-number (:x params)) 
                   (to-number (:y params)))
          as-str (join "," (map #(% newb) [:top :right :bottom :left]))]
      (assoc params :bounds as-str))))

(defpartial input-fields [{:keys [lut bounds size cut-off x y] :as params}]
  (hidden-field "bounds" bounds)
  (hidden-field "size" "800,600")
  (html
    [:div#control-ribbon
      (label "lut" "LUT:")
      (drop-down "lut" lut/available-luts lut)
      (label "cut-off" "Cut-off:")
      (drop-down "cut-off" (map str (range 50 1000 25)) cut-off)
      (submit-button { :id "refresh" }  "Refresh")
      (submit-button { :id "initial" }  "Initial")
      (submit-button { :id "zoom-in" }  "Zoom in")
      (submit-button { :id "zoom-out" } "Zoom out")
      (submit-button { :id "julia" }    "Julia")]))

(defremote zoom-in [params]
  (process-params params frac/zoom-in))

(defremote zoom-out [params]
  (process-params params frac/zoom-out))

(defpage [:get "/fractal"] {:as params}
  (let [params (process-params params)]
    (common/layout
      (input-fields params)
      (html 
        [:div#fractal
          (link-to "#" (image (url "render" params)))
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

(defpage "/render" {:as params}
  (let [params    (defaults params)
        color-map (partial lut/get-color (lut/from-name (:lut params)))
        size      (parse-arg (:size params))
        bounds    (parse-arg (:bounds params))
        cut-off   (first (parse-arg (:cut-off params))) ]
    (frac/fractal
      size
      (frac/mandlebrot-set bounds)
      cut-off
      color-map)))

(defpage "/julia" {:keys [lut bounds size cut-off start-posn]}
  (let [color-map (partial lut/get-color (lut/from-name lut))]
    (frac/fractal
      (parse-arg size [800 600])
      (frac/julia-set 
        (parse-arg start-posn) 
        (parse-arg bounds [1 1.5 -1 -1.5]))
      (first (parse-arg cut-off [50]))
      color-map)))
