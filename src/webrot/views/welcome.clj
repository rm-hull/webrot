(ns webrot.views.welcome
  (:require [webrot.views.common :as common]
            [webrot.data-mappers.lut :as lut]
            [webrot.data-mappers.bounds :as b]
            [webrot.data-mappers.pascal :as p]
            [webrot.data-mappers.fractal :as f])
  (:use [noir.core :only [defpage defpartial]]
        [noir.fetch.remotes :only [defremote]]
        [hiccup.core :only [html]]
        [hiccup.form]
        [hiccup.element]
        [hiccup.util]
        [clojure.string :only [split join]])
  (:import [java.awt.image BufferedImage]))

(defmulti to-number class)
(defmethod to-number Number [n] n)
(defmethod to-number :default [obj] (read-string obj))

(defn- parse-arg
  ([arg] (parse-arg arg nil))
  ([arg defaults]
    (if (seq arg)
      (map to-number (split arg #","))
      defaults)))

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
          bounds (b/to-bounds (parse-arg (:bounds params)))
          screen (b/to-bounds [0 800 600 0])
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
      (label :lut "LUT:")
      (drop-down :lut lut/available-luts lut)
      (label :cut-off "Cut-off:")
      (drop-down :cut-off (map str (range 50 1000 25)) cut-off)
      (submit-button { :id "refresh" }  "Refresh")
      (submit-button { :id "initial" }  "Initial")
      (submit-button { :id "zoom-in" }  "Zoom in")
      (submit-button { :id "zoom-out" } "Zoom out")
      (label :drag-target "Drag target for Julia Set")
      (image { :id "drag-target" } "img/target32-invert-blur.png")
     ]))

(defremote real-coords [params]
  (let [params (defaults params)
        size   [0 800 600 0] ; (parse-arg (:size params))
        bounds (parse-arg (:bounds params))
        x      (to-number (:x params))
        y      (to-number (:y params))]
    (b/real-coords bounds size x y)))

(defremote zoom-in [params]
  (process-params params b/zoom-in))

(defremote zoom-out [params]
  (process-params params b/zoom-out))

(defpage [:get "/mandlebrot"] {:as params}
  (let [params (process-params params)]
    (common/layout
      (input-fields params)
      (html 
        [:div#fractal
          (link-to "#" (image { :id "drop-zone" } (url "render" params)))
          (common/spinner "container grey")]))))

(defpage [:get "/sierpinski"] {:as params}
  (let [color   0xFFFFFF
        rows    (to-number (get params :size 320))
        divisor (to-number (get params :divisor 2))]
    (p/draw-gasket rows divisor color)))

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
  (let [params      (defaults params)
        color-map   (partial lut/get-color (lut/from-name (:lut params)))
        size        (parse-arg (:size params))
        bounds      (parse-arg (:bounds params))
        cut-off     (to-number (:cut-off params))
        fractal-set (case (:type params)
                      "mandlebrot" (f/mandlebrot-set bounds)
                      "julia"      (f/julia-set bounds (parse-arg (:start-posn params))))]
    (f/fractal
      size
      fractal-set
      cut-off
      color-map)))
