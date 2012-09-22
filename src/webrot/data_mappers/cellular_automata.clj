(ns webrot.data-mappers.cellular-automata)

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

(defn stepper [neighbours birth? survive?]
  (fn [cells]
    (set (for [[loc n] (frequencies (mapcat neighbours cells))
               :when (if (cells loc) (survive? n) (birth? n))]
           loc))))

(def conways-game-of-life
  (stepper (partial place neighbours) #{3} #{2 3}))

(defn trim [[w h] cells]
  (let [sanitize (fn [[x y]] (and (>= x 0) (>= y 0) (< x w) (< y h)))]
    (set (filter sanitize cells))))
