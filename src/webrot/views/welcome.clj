(ns webrot.views.welcome
  (:require [webrot.views.common :as common])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/welcome" []
         (common/layout
           [:h1 "Welcome to webrot!"]
           [:p "You are visitor zero."]))
