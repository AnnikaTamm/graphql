package main

import (
	"log"
	"net/http"
	"html/template"
)

func main() {

	http.Handle("/src/", http.StripPrefix("/src/", http.FileServer(http.Dir("./src/"))))
	http.HandleFunc("/", loginPage)
	http.HandleFunc("/graphql", graphPage)


	
	log.Println("Server starting on http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func loginPage(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("index.html")	
	if err != nil {
		http.Redirect(w, r, "/", http.StatusInternalServerError)
	}
	if err := t.Execute(w, nil); err != nil {
		http.Redirect(w, r, "/", http.StatusInternalServerError)
	}

}
func graphPage(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("graphql.html")	
	if err != nil {
		http.Redirect(w, r, "/", http.StatusInternalServerError)
	}
	if err := t.Execute(w, nil); err != nil {
		http.Redirect(w, r, "/", http.StatusInternalServerError)
	}

}