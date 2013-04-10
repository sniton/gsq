
var windowWidth;
var windowHeight;
var siteIsInit = false




/*
 ######   ##        #######  ########     ###    ##       
##    ##  ##       ##     ## ##     ##   ## ##   ##       
##        ##       ##     ## ##     ##  ##   ##  ##       
##   #### ##       ##     ## ########  ##     ## ##       
##    ##  ##       ##     ## ##     ## ######### ##       
##    ##  ##       ##     ## ##     ## ##     ## ##       
 ######   ########  #######  ########  ##     ## ######## 
 */

$(window).load(function(){
	siteInit()
})


function siteInit(){
	if(!siteIsInit){
		getDimensions()
		ajustStructure()
		globalEvents()
		navEvents()
		contentEvents()
		
		siteIsInit = true;
	}
}
function siteResfresh(){
	if(siteIsInit){
		getDimensions()
		ajustSections()
	}
}

var oPanier
var oSound
function globalEvents(){
	$(document).bind('touchmove', false);

	oPanier = new panier()	

	oSound = new sound()

	$('#form_paniersend').submit(function(e){
		e.preventDefault()
		var destinataire = $('.input_email', this).val()
		if(destinataire) oPanier.send(destinataire)
	})
}

function getDimensions(){
	newwindowWidth = window.innerWidth > $(window).width() ? window.innerWidth : $(window).width() ;
	newwindowHeight = window.innerHeight > $(window).height() ? window.innerHeight : $(window).height();

	if(windowWidth != newwindowWidth || windowHeight != newwindowHeight){
		windowWidth = newwindowWidth
		windowHeight = newwindowHeight
	}
}

function ajustStructure(){
	windowHeight = windowHeight > 748 ? 748 : windowHeight
	$('#wrapper').height(windowHeight)
}


var sound = function(){
	var self = this
	var sounds = new Array()

	this.construct = function(){
		$.ajax({
			dataType: "json",
			url: 'configs/sounds.json',
			success: function(data){
				$.each(data, function(name, file){
					sounds[name] = new Audio("sounds/"+file)
					sounds[name].play()
				})
			}
		});
	}

	this.play = function(name){
		sounds[name].play()
	}

	this.construct()
}



/*
########     ###    ##    ## #### ######## ########  
##     ##   ## ##   ###   ##  ##  ##       ##     ## 
##     ##  ##   ##  ####  ##  ##  ##       ##     ## 
########  ##     ## ## ## ##  ##  ######   ########  
##        ######### ##  ####  ##  ##       ##   ##   
##        ##     ## ##   ###  ##  ##       ##    ##  
##        ##     ## ##    ## #### ######## ##     ## 
*/
var panier = function(){
	var self = this
	var opened;
	var panier;
	var availableItems 				// Liste des items disponible dans toute l'appli
	var availableItemsByType = {} 	// Liste des items disponibles groupés par type
	var availableItem 				// Elements disponible sur la page
	var panierList = {}				// Liste des items dans le panier
	var totalPanierItems = 0

	this.construct = function(){
		this.opened = false;
		this.panier = $('#panier')
		this.panierList = {'reference': {}, 'video' : {}}
		this.availableItemsByType = {'reference': {}, 'video' : {}}

		$.ajax({
			dataType: "json",
			url: 'configs/panier.json',
			success: function(data){
				self.availableItems = data

				// Trie des items par type
				$.each(self.availableItems, function(key, value){
					self.availableItemsByType[value.type][key] = value
				})

				// Affichage de la liste dans la page panier
				var html
				html += "<dt>Vidéos</dt>"
				$.each(self.availableItemsByType.video, function(key, value){
					html += "<dd>"+value.title+"</dd>"
				})
				html += "<dt>Références</dt>"
				$.each(self.availableItemsByType.reference, function(key, value){
					html += '<dd><input type="checkbox" id="panierItem'+key+'">'+value.title+'</dd>'
				})
				$('#pages .panier .liste').html(html)
			}
		});

		// Lancement des évènements
		$(this.panier).hammer().on("tap", function(e){
			self.open()
		})	
		$('.button', panier).hammer().on("tap", function(e){
			self.close()
		})	
		$('.menu .item', panier).hammer().on("tap", function(){
			self.lauchAction(this)
		})

		// Restauration du panier
		self.restorePanierList()

	}
	// UI
	this.open = function(){
		if(!this.opened){
			oSound.play('panieropen')
			this.panier.addClass('active')
			setTimeout(function(){
				self.opened = true
			}, 500)
		}
	}
	this.close = function(){
		if(this.opened){
			oSound.play('panieropen')
			this.panier.removeClass('active')
			$('.menu .item', this.panier).removeClass('active')
			setTimeout(function(){
				self.opened = false
			}, 500)
			if(oNavigation.currentPage == 'panier' || oNavigation.currentPage == 'paniersend'){
				oNavigation.navTo('accueil')
			}
		}
	}
	this.lauchAction = function(item){
		oSound.play('panieradd')
		$('.menu .item.active', this.panier).removeClass('active')
		$(item).addClass('active')
		var action = $(item).attr('data-action')
		switch (action) {
			case 'add' :
				this.addToPanier()
				break;
			case 'see' :
				this.seePanier()
				break;
			case 'send' :
				this.sendPanier()
				break;
			case 'empty' :
				this.emptyPanier()
				break;
		}
	}
	this.setAvailable = function(element){
		if(element){
			this.panier.addClass('available')
			this.availableItem = element
		}else{
			this.panier.removeClass('available')
			this.availableItem = null;
		}
		this.isInPanier(element)
	}
	// Actions
	this.addToPanier = function(){
 		var item = this.availableItems[this.availableItem]
		var type = item.type
		this.panierList[type][this.availableItem] = item
		console.log(this.panierList)
		this.refresh()
	}
	this.removeToPanier = function(item){
		var type = this.availableItems[item].type
		delete this.panierList[type][item]
		console.log(this.panierList)
		this.refresh()
	}
	this.seePanier = function(){
		self.restorePanierList()
		oNavigation.navTo('panier')
	}
	this.sendPanier = function(){
		oNavigation.navTo('paniersend')
	}
	this.emptyPanier = function(){
		if(confirm("Voulez-vous vider le panier ?")){
			this.panierList = {'reference': {}, 'video' : {}}
			console.log(this.panierList)
			this.refresh()
		}
	}
	this.send = function(destinataire){
		console.log('--send')
		if (navigator.connection) {
		    var networkState = navigator.connection.type;

		    if (networkState == Connection.NONE){
		    	if(confirm("Vous n'êtes pas connecté à internet. Voulez-vous sauvegarder votre panier pour l'envoyer ultérieurement ?")){
		    		self.savePanierList()
		    	}
		    }else{
				var callback = {destinataire : destinataire, items : []}
				$.each(this.panierList, function(key, type){
					$.each(type, function(key, value){
						callback.items.push(key)
					})
				})
				console.log(callback)
				var jsonpCallback = JSON.stringify(callback)
				console.log(jsonpCallback)
				$.ajax({
					url : "http://test.kromi.fr/gdfqatarserveur/index.php",
					contentType: "application/json",
		        	dataType: 'jsonp',
		        	jsonpCallback : jsonpCallback
				})
		        alert("L'e-mail a été envoyé avec succès")
		    }
		}
	}
	// Data
	this.savePanierList = function(){
		localStorage.setItem('panierList', JSON.stringify(self.panierList))
		alert("Panier sauvegardé")
	}
	this.restorePanierList = function(){
		var savedPanierList = localStorage.getItem('panierList')
		if(savedPanierList){
			self.panierList = JSON.parse(savedPanierList)
			localStorage.removeItem('panierList')
		}
	}
	this.refresh = function(){
		// Comptage des références
		var references = Object.keys(this.panierList.reference).length
		$('#pages .panier .references').text(references)

		// Comptage du total
		this.totalPanierItems = references
		$('#pages .panier .totalPanier').text(this.totalPanierItems)

		// Mise à jour de la liste des items dans le panier
		$('#pages .panier input').attr('checked', false)
		$.each(this.panierList, function(key, type){
			$.each(type, function(key, value){
				console.log('check '+key)
				$('#pages .panier #panierItem'+key).attr('checked', true)
			})
		})

		// Actication/désactivation de l'icone vider la panier
		if(this.totalPanierItems){
			$('.menu .item.vider', this.panier).removeClass('disabled')
		}else{
			$('.menu .item.vider', this.panier).addClass('disabled')
		}

		this.isInPanier(this.availableItem)
	}
	this.isInPanier = function(element){
		if(element){
			var type = this.availableItems[element].type
			if(this.panierList[type][element]){
				$('.menu .item.ajouter', this.panier).hide()
				$('.menu .item.retirer', this.panier).show()
			}else{
				$('.menu .item.ajouter', this.panier).show()
				$('.menu .item.retirer', this.panier).hide()
			}
		}else{
			$('.menu .item.ajouter', this.panier).show()
			$('.menu .item.retirer', this.panier).hide()
		}
	}
	
	this.construct()
}
function onLoadPanier(){
	console.log('--onLoadPanier')
	oPanier.refresh()
}
function onLoadPanierSend(){
	if (navigator.connection) {
	    var networkState = navigator.connection.type;

	    if (networkState == Connection.NONE){
	    	$('#pages .paniersend .etatconnexion').text("offline")
	    }else{
	    	$('#pages .paniersend .etatconnexion').text("online")
	    }
	}
}



/*
##    ##    ###    ##     ## 
###   ##   ## ##   ##     ## 
####  ##  ##   ##  ##     ## 
## ## ## ##     ## ##     ## 
##  #### #########  ##   ##  
##   ### ##     ##   ## ##   
##    ## ##     ##    ###    
*/
var oNavigation
function navEvents(){
	oNavigation = new navigation();

	$('a.linktest').click(function(e){
		e.preventDefault()
		var page = $(this).attr('href')
		oNavigation.navTo(page)
	})	
}

var navigation = function(){
	var currentPage = 'accueil';
	var self = this
	var arborescence
	var currentFond;
	var menu = $('#menu')
	var currentMenuLinks = new Array
	var menuIsHide = false

	this.loadArborescence = function(){
		$.ajax({
			dataType: "json",
			url: 'configs/arborescence.json',
			success: function(data){
				self.arborescence = data
			}
		});
	}
	this.menuEvents = function(){
		$('.niveau0 .linkZone', menu).hammer().on('tap', function(){
			var page = $(this).attr('data-page')
			self.navTo(page)
		})
		$('.niveau1 .linkZone, .niveau2 .linkZone', menu).hammer().on('tap', function(){
			var index = $(this).attr('data-index')
			var page = $(this).attr('data-page')
			self.navTo(page)
		}).on('swipe', function(e){
			console.log(menuIsHide)
			if(menuIsHide){
				var direction = e.gesture.direction
				if(direction == 'left'){
					$(this).next('.linkZone').trigger('tap')
				}else if(direction =='right'){
					$(this).prev('.linkZone').trigger('tap')
				}
			}
		})
		$(menu).hammer().on('swipe', function(e){
			var direction = e.gesture.direction
			if(direction == 'down'){
				self.hideMenu()
			}else if(direction == 'up'){
				self.showMenu()
			}
		})
	}
	this.navTo = function(page){
		this.changeFond(this.arborescence[page].fond)
		this.changePage(page)
		oPanier.setAvailable(this.arborescence[page].panier)
	}
	this.changeFond = function(fond){
		if(fond != this.currentFond){
			$('#fonds .fond.active').removeClass('active')
			$('#fonds .fond.'+fond).addClass('active')
			this.currentFond = fond;
		}
	}
	this.changePage = function(page){
		console.log("--changePage")
		if(page != this.currentPage){
			var virtual = this.arborescence[page].virtual
			if(!virtual){
				$('#pages .template.active').removeClass('active')
				var template = this.arborescence[page].template
				if(template){
					if(!$('#pages .template[data-page='+page+']').length){	
						console.log("la page n'existe pas, il faut la charger")
						var datas = self.arborescence[page].datas
						if(datas){
							oDatas.pushDatasToTemplate(page, template)
						}
					}
					var onLoadFunction = this.arborescence[page].onload
					if(onLoadFunction){
						window[onLoadFunction]()
					}
					setTimeout(function(){
						$('#pages .template[data-page='+page+']').addClass('active')
					}, 700)
				}else{
					console.log("error: le template n'existe pas")
				}
			}
			if(this.arborescence[page].disablemenu){
				$(menu).addClass('disabled')
			}else{
				$(menu).removeClass('disabled')
			}
			this.refreshMenu(page, virtual)
			this.currentPage = page
		}
	}
	this.refreshMenu = function(page, virtual){
		console.log("--refreshMenu")
		var niveau = this.arborescence[page].niveau
		var index = this.arborescence[page].index
		if(niveau == 2){
			$(menu).addClass('isniveau1 isniveau2')
			this.getPagesByParent(this.arborescence[page].parent)
			var angle = - (60 * (index - 1))
			$('.niveau2 .background, .niveau2 .links', menu).css('-webkit-transform', 'rotate('+angle+'deg)')
		}else if(niveau == 1){
			$(menu).addClass('isniveau1').removeClass('isniveau2')
			var angle = - (60 * (index - 1))
			$('.niveau1Background .background, .niveau1', menu).css('-webkit-transform', 'rotate('+angle+'deg)')
		}else if(niveau == 0){
			$(menu).removeClass('isniveau1 isniveau2')
			var angle = (180 * (index - 1))
			$('.base, .niveau0', menu).css('-webkit-transform', 'rotate('+angle+'deg)')
		}else{
			$(menu).removeClass('isniveau1 isniveau2 hide disabled')
		}
		if(virtual){
			this.getPagesByParent(page)
		}else if(page != 'accueil'){
			setTimeout(function(){
				self.hideMenu()
			},300)
		}
	}
	this.getPagesByParent = function(parent){
		console.log(parent)
		var niveau = this.arborescence[parent].niveau+1
		if(currentMenuLinks[niveau] != parent){
			console.log("--getPagesByParent")
			var pages = new Array;
			var index = 1
			$.each(this.arborescence, function(page, data){
				if(data.parent == parent){
					console.log("page enfant trouvée")
					console.log(page)
					$('.niveau'+niveau+' .linkZone.item'+index, self.menu).attr('data-page', page).text(page)
					index++
				}
			})
			currentMenuLinks[niveau] = parent
			console.log(currentMenuLinks)
		}
		$(menu).addClass('isniveau'+niveau)
	}
	this.showMenu = function(){
		$(menu).removeClass('hide')
		menuIsHide = false
		oSound.play('panieropen')
	}
	this.hideMenu = function(){
		$(menu).addClass('hide')
		menuIsHide = true
		oSound.play('panieropen')
	}

	this.loadArborescence()
	this.menuEvents()
}


/*
 ######   #######  ##    ## ######## ######## ##    ## ######## 
##    ## ##     ## ###   ##    ##    ##       ###   ##    ##    
##       ##     ## ####  ##    ##    ##       ####  ##    ##    
##       ##     ## ## ## ##    ##    ######   ## ## ##    ##    
##       ##     ## ##  ####    ##    ##       ##  ####    ##    
##    ## ##     ## ##   ###    ##    ##       ##   ###    ##    
 ######   #######  ##    ##    ##    ######## ##    ##    ##    
 */

var oDatas
function contentEvents(){
	$('.template.presencedanslegolfe .marker').hammer().on('tap', function(){
		var pays = $(this).attr('data-pays')
		oNavigation.navTo(pays)
	})

	oDatas = new datas()
}

var datas = function(){
	var self = this
	var datas

	this.loadDatas = function(){
		$.ajax({
			dataType: "json",
			url: 'configs/data.json',
			success: function(data){
				self.datas = data
			}
		});
	}
	this.pushDatasToTemplate = function(page, template){
		console.log("--pushDatasToTemplate")
		console.log(this.datas[page])
		var view = $('#templates .template.'+template).html()
		var output = Mustache.render(view, this.datas[page])
		var page = $('<div class="template '+template+'" data-page="'+page+'"></div>').html(output).appendTo('#pages')
	}

	this.loadDatas()
}
