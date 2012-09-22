(ns webrot.data-mappers.cellular-automata)

(def neighbours
  (for [i [-1 0 1]
        j [-1 0 1]
        :when (not= 0 i j)]
    [i j]))

(def block
  (for [i [-1 0 1]
        j [-1 0 1]]
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

(def vichniac-vote
  (stepper (partial place block) #{5 6 7 8 9} #{5 6 7 8 9}))

(defn trim [[w h] cells]
  (let [sanitize (fn [[x y]] (and (>= x 0) (>= y 0) (< x w) (< y h)))]
    (set (filter sanitize cells))))


;(defn encode [[w h] cells]
;  (for [y (range h)
;        x (range w)
;        :let [cell (if (cells [x y]) 1 0)]]
;    cell))
;
;(defn decode [[w h] points]
;  (let [cells (for [y (range h) x (range w)] [x y])]
;    (->> (map vector points cells)
;         (filter (comp pos? first))
;         (map second)
;         set)))
