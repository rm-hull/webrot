(ns webrot.client.conway.core
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm])
  (:use [monet.canvas :only [get-context fill-style circle rect alpha begin-path close-path fill]]
        [jayq.core :only [$ document-ready data]]))

(def canvas ($ :canvas#world))
(def ctx (get-context (.get canvas 0) "2d"))
(def ca-type (data canvas :ca-type))
(def color (data canvas :color))
(def threshold (data canvas :rand))

;(def glider 
;  #{[2 0] [2 1] [2 2] [1 2] [0 1]})
;
;(def beacon 
;  #{[0 0] [0 1] [1 0] [1 1] [2 2] [2 3] [3 2] [3 3]})
;
;(def toad
;  #{[2 3] [2 4] [3 5] [4 2] [5 3] [5 4]})
;
;(def light-spaceship 
;  #{[2 0] [4 0] [1 1] [1 2] [1 3] [4 3] [1 4] [2 4] [3 4]})
; 
;(def oscillator
;  #{[1 0] [1 1] [1 2]})

(defn transform 
  "Transforms a point [x y] by a given offset [dx dy]"
  [[x y] [dx dy]]
  [(+ x dx) (+ y dy)])

(defn place [artefact position]
  (map (partial transform position) artefact))

(defn dot [ctx [x y]]
  (rect ctx {:x (bit-shift-left x 3) :y (bit-shift-left y 3) :w 7 :h 7}))

(defn random-world [[w h] probability]
  (flatten
    (for [x (range w)
          y (range h)
          :when (< (rand) probability)]
      [x y])))

(def size [100 75])
(def world (atom (random-world size threshold)))

(defn draw-cells [ctx cells]
  (-> ctx
      (fill-style "#000000")
      (alpha 0.5)
      (rect {:x 0 :y 0 :w 800 :h 600})
      (fill-style color)
      (alpha 1.0))
  (doseq [c cells]
    (dot ctx c)))

;(defn draw-points [ctx points]
;  (-> ctx
;      (fill-style "#000000")
;      (alpha 0.5)
;      (rect {:x 0 :y 0 :w 800 :h 600})
;      (fill-style color)
;      (alpha 1.0))
;  (doseq [[pt loc] (map vector points cells)]
;    (if (pos? pt)
;      (dot ctx loc))))

;(defmacro logger [expr]
;  `(let [start# (. System (nanoTime))
;         ret# ~expr]
;     (.log js/console (str expr " - elapsed time: " (/ (double (- (. System (nanoTime)) start#)) 1000000.0) " msecs"))
;     ret#))

(def animate)

(defn animate []
  (fm/remote (ca-next-gen size ca-type (deref world)) [next-gen]
    (. js/window (requestAnimFrame animate))
    (draw-cells ctx (partition 2 next-gen))
    (reset! world next-gen)))

(draw-cells ctx (partition 2 (deref world)))
(animate)


