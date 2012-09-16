(ns webrot.data-mappers.cellular-automata)

(def glider 
  #{[2 0] [2 1] [2 2] [1 2] [0 1]})

(def light-spaceship 
  #{[2 0] [4 0] [1 1] [1 2] [1 3] [4 3] [1 4] [2 4] [3 4]})
 
(def oscillator
  #{[1 0] [1 1] [1 2]})

(def neighbours
  (for [i [-1 0 1]
        j [-1 0 1]
        :when (not= 0 i j)]
    [i j]))

(defn transform 
  "Transforms a point [x y] by a given offset [dx dy]"
  [[x y] [dx dy]]
  [(+ x dx) (+ y dy)])

(defn place [artefact position]
  (map (partial transform position) artefact))

(defn random-world 
  "Makes a random collection of cells of the given dimensions and population count"
  [[w h] items]
  (into #{}
    (take items (map vector 
                     (repeatedly #(int (rand w)))
                     (repeatedly #(int (rand h)))))))

(def world
  (into #{}
    (concat
      (place oscillator [25 5])
      (place oscillator [17 2])
      (place glider [7 3])
      (place glider [10 11])
      (place glider [34 7])
      (place light-spaceship [4 16]))))
 
(defn maxf [f coll]
  (reduce max (map f coll)))

(defn to-grid
  ([cells] (to-grid cells [(maxf first cells) (maxf second cells)]))
  ([cells [w h]]
    (for [y (range (inc h))]
      (for [x (range (inc w))
            :let [loc [x y]]]
        (if (cells loc) "X" " ")))))
     
(defn display [grid-rows]
  (doall (map #(println "[" (apply str %) "]") grid-rows))
  (println))
  
(defn stepper [neighbours birth? survive?]
  (fn [cells]
    (set (for [[loc n] (frequencies (mapcat neighbours cells))
               :when (if (cells loc) (survive? n) (birth? n))]
           loc))))

(def conways-game-of-life
  (stepper (partial place neighbours) #{3} #{2 3}))

(def generations (partial iterate conways-game-of-life))

;(def x (random-world [40 30] 200))
;
;(display (nth (map to-grid (generations x)) 0))
;
;(display (nth (map to-grid (generations x)) 1))
;
;(display (nth (map to-grid (generations x)) 2))
;
;(display (nth (map to-grid (generations x)) 3))
;
;(display (nth (map to-grid (generations x)) 4))
;
;(display (nth (map to-grid (generations x)) 5))
;
;(display (nth (map to-grid (generations x)) 6))
;
;(display (nth (map to-grid (generations x)) 7))
;
;(display (nth (map to-grid (generations x)) 8))
;
;(display (nth (map to-grid (generations x)) 9))
;
;(display (nth (map to-grid (generations x)) 10))
