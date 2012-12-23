(ns webrot.client.conway.core
  (:require [fetch.remotes :as remotes])
  (:require-macros [fetch.macros :as fm])
  (:use [monet.canvas :only [get-context fill-style rect alpha begin-path line-to move-to close-path fill]]
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

(def seven-bar
   (set (map #(vector % 0) (range 7))))

; TODO: make this exportable from clj files
(defn transform 
  "Transforms a point [x y] by a given offset [dx dy]"
  [[^long x ^long y] [^long dx ^long dy]]
  [(+ x dx) (+ y dy)])

; TODO: make this exportable from clj files
(defn place [artefact position]
  (map #(transform position %) artefact))

(defn dot [ctx [x y]]
  (let [a (* x 8)
        b (* y 8)]
    (-> ctx
        (move-to a b)
        (line-to a (+ b 7))
        (line-to (+ a 7) (+ b 7))
        (line-to (+ a 7) b))))

(defn random-world [[w h] probability]
  (flatten
    (for [x (range w)
          y (range h)
          :when (< (rand) probability)]
      [x y])))

(def size [100 75])
(def world 
  (atom 
    (case ca-type
      "circle" (flatten (place seven-bar [47 34]))
      (random-world size threshold))))

(defn draw-cells [ctx cells]
  (-> ctx
      (fill-style "#000000")
      (alpha 0.5)
      (rect {:x 0 :y 0 :w 800 :h 600})
      (fill-style color)
      (alpha 1.0)
      (begin-path))
  (doseq [c cells]
    (dot ctx c))
  (-> ctx
      (fill)
      (close-path)))

(def animate)

(defn animate []
  (fm/remote (ca-next-gen size ca-type (deref world)) [next-gen]
    (. js/window (requestAnimFrame animate))
    (draw-cells ctx (partition 2 next-gen))
    (reset! world next-gen)))

(draw-cells ctx (partition 2 (deref world)))
(animate)

