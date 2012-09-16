(ns webrot.client.conway.core
  (:use [monet.canvas :only [get-context fill-style circle rect alpha]]
        [jayq.core :only [$ document-ready]]))

(def ctx (get-context (.get ($ :#conway) 0) "2d"))

(defn dot 
  ([ctx [x y]] (dot ctx [x y] 4))
  ([ctx [x y] size]
    (circle ctx {:x (+ size (* x size 2)) :y (+ size (* y size 2)) :r size})))

(def glider 
  #{[2 0] [2 1] [2 2] [1 2] [0 1]})

(def light-spaceship 
  #{[2 0] [4 0] [1 1] [1 2] [1 3] [4 3] [1 4] [2 4] [3 4]})
 
(def oscillator
  #{[1 0] [1 1] [1 2]})

(defn transform 
  "Transforms a point [x y] by a given offset [dx dy]"
  [[x y] [dx dy]]
  [(+ x dx) (+ y dy)])

(defn place [artefact position]
  (map (partial transform position) artefact))

(def world
  (into #{}
    (concat
      (place oscillator [25 5])
      (place oscillator [17 2])
      (place glider [7 3])
      (place glider [10 11])
      (place glider [34 7])
      (place light-spaceship [4 16]))))

(defn random-world 
  "Makes a random collection of cells of the given dimensions and population count"
  [[w h] items]
  (into #{}
    (take items (map vector 
                     (repeatedly #(int (rand w)))
                     (repeatedly #(int (rand h)))))))

(defn maxf [f coll]
  (reduce max (map f coll)))

(defn draw-cells
  ([ctx cells] (draw-cells ctx cells [(maxf first cells) (maxf second cells)]))
  ([ctx cells [w h]]
    (for [y (range (inc h))
          x (range (inc w))
          :let [locn  [x y]
                [color opacity] (if (cells locn) 
                                  ["#ffff00" 1.0] 
                                  ["#000000" 0.5])]]
      (-> ctx 
          (fill-style color) 
          (alpha opacity) 
          (dot locn)))
;    ctx))
  ))

(document-ready
  (fn []
    (-> ctx
        (draw-cells (random-world [50 50] 200) [50 50])
        (dot [2 0])
      )))


