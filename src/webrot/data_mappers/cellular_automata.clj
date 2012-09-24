(ns webrot.data-mappers.cellular-automata)

(def neighbours
  (for [i [-1 0 1]
        j [-1 0 1]
        :when (not= 0 i j)]
    [i j]))

(def nine-block
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
  (fn [cells trim-fn]
    (set (for [[loc n] (frequencies (mapcat neighbours cells))
               :when (and 
                       (if (cells loc) (survive? n) (birth? n))
                       (trim-fn loc))]
           loc))))

(def conways-game-of-life
  (stepper (partial place neighbours) #{3} #{2 3}))

(def semi-vote
  (stepper (partial place neighbours) #{3 5 6 7 8} #{4 6 7 8}))

(def vichniac-vote
  (stepper (partial place nine-block) #{5 6 7 8 9} #{5 6 7 8 9}))

(def unstable-vichniac-vote
  (stepper (partial place nine-block) #{4 6 7 8 9} #{4 6 7 8 9}))

(def fredkin
  (stepper (partial place nine-block) #{1 3 5 7 9} #{1 3 5 7 9}))



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
