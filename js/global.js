
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

	oSound = new sound()
	oPanier = new panier()	


	$('#pages .panier .actions .clearall').hammer().on('tap', function(){
		oPanier.emptyPanier()
	})
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
				var html = ''
				html += "<dt>Your contacts</dt>"
				html += '<dd class="item disabled checked" data-item="allcontacts">Your GDF SUEZ contact for all your projects</dd>'
				html += "<dt>Videos</dt>"
				$.each(self.availableItemsByType.video, function(key, value){
					html += '<dd class="item">'+value.title+'</dd>'
				})
				html += "<dt>References</dt>"
				$.each(self.availableItemsByType.reference, function(key, value){
					html += '<dd class="item" data-item="'+key+'">'+value.title+'</dd>'
				})
				$('#pages .panier .content .liste').html(html)

				// Lancement des évènements
				$('#pages .panier .content .liste .item:not(.disabled)').hammer().on('tap', function(){
					console.log('check panier item')
					$('#log').append('<br>check panier item')
					var item = $(this).attr('data-item')
					$(this).toggleClass('checked')
					if($(this).hasClass('checked')){
						oPanier.addToPanier(item)
						oSound.play('paniercheck')
					}else{
						oPanier.removeToPanier(item)
						oSound.play('panieruncheck')
					}
				})
				$('#pages .panier .content .wrapper').tinyscrollbar({invertscroll: true});
			}
		});

		// Lancement des évènements
		$(this.panier).hammer().on("tap", function(e){
			self.open()
		})	
		$('.button', this.panier).hammer().on("tap", function(e){
			self.close()
		})	
		$('.menu .item', this.panier).hammer().on("tap", function(){
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
				oNavigation.navTo('home')
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
			this.isInPanier(element)
		}else{
			this.panier.removeClass('available')
			this.availableItem = null;
		}
	}
	// Actions
	this.addToPanier = function(availableItem){
		var availableItem = availableItem ? availableItem : this.availableItem
 		var item = this.availableItems[availableItem]
		var type = item.type
		this.panierList[type][availableItem] = item
		console.log(this.panierList)
		this.refresh()
	}
	this.removeToPanier = function(availableItem){
		var availableItem = availableItem ? availableItem : this.availableItem
 		var item = this.availableItems[availableItem]
 		var type = item.type
		delete this.panierList[type][availableItem]
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
		$('#pages .panier .facettes .references, #pages .paniersend .facettes .references').text(references)

		// Comptage du total
		this.totalPanierItems = references + 1
		var totalpanier = this.totalPanierItems < 10 ? "0"+this.totalPanierItems : this.totalPanierItems ;
		$('#pages .panier .counter, #pages .paniersend .counter').text(totalpanier)

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
	    	$('#pages .paniersend .etatconnexion').addClass("offline")
	    }else{
	    	$('#pages .paniersend .etatconnexion').removeClass("offline")
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
var inNavAction = false;
var oNavigation
function navEvents(){
	oNavigation = new navigation();
}

var navigation = function(){
	var self = this
	var currentPage
	var arborescence
	var currentFond;
	var menu = $('#menu')
	var currentMenus = new Array
	var menuIsHide = false

	this.construct = function(){
		this.currentPage = 'home'
		this.currentMenus = [null, null]
	}
	this.loadArborescence = function(){
		$.ajax({
			dataType: "json",
			url: 'configs/arborescence.json',
			success: function(data){
				self.arborescence = data
				console.log(data)
			}
		});
	}
	this.defaultEvents = function(){
		$('.niveau0 .linkZone', menu).hammer().on('tap', function(){
			if(!inNavAction){
				inNavAction = true;
				var page = $(this).attr('data-page')
				$('#log').append('<br>niveau0 event + '+page)
				self.navTo(page)	
				setTimeout(function(){
					inNavAction = false;
				},500)
			}

		})
		$(menu).hammer().on('swipe', function(e){
			console.log('swipe on menu')
			$('#log').append('<br>swipe on menu')
			var direction = e.gesture.direction
			if(direction == 'down'){
				self.hideMenu()
			}else if(direction == 'up'){
				self.showMenu()
			}
		})
		$('header#header .backLink').hammer().on('tap', function(){
			var page = $(this).attr('data-page')
			$(this).attr('data-page', '').removeClass('active')
			self.navTo(page)
		})
		$('header#header .menuLink').hammer().on('tap', function(){
			self.showMenu()
		})
		$('#logo').hammer().on('tap', function(){
			// self.navTo('home')
			self.navTo('video-test')
		})
	}
	this.niveau1and2Events = function(){
		$('.niveau1 .linkZone, .niveau2 .linkZone', menu).hammer().off('tap swipe').on('tap', function(){
			inNavAction = true
			var page = $(this).attr('data-page')
			self.navTo(page)
			setTimeout(function(){
				inNavAction = false
			},300)
		}).on('swipe', function(e){
			if(menuIsHide){
				console.log('swipe on nav')
				$('#log').append('<br>swipe on nav')
				console.log(menuIsHide)
				console.log(this)
				var direction = e.gesture.direction
				var index = $(this).attr('data-index')
				if(direction == 'left'){
					index++
				}else if(direction =='right'){
					index--
				}
				if(direction == 'left' || direction =='right'){
					console.log($(this).parent().find('.linkZone[data-index='+index+']'))
					var page = $(this).parent().find('.linkZone[data-index='+index+']').attr('data-page')
					self.navTo(page)
				}
			}
		})
		$('.niveau2 .linkZone', menu).mouseover(function(){
			console.log('over')
		})
	}
	this.navTo = function(page, backLink, backLinkText){
		console.log('--navTo')
		console.log(page)
		console.log(this.arborescence[page])
		var redirect = this.arborescence[page].redirect
		if(redirect){
			this.navTo(redirect)
		}else{
			if(backLink){
				$('header#header .backLink').attr('data-page', backLink).text(backLinkText).addClass('active')
			}
			this.changeFond(this.arborescence[page].fond)
			this.changePage(page)
			oPanier.setAvailable(this.arborescence[page].panier)
		}
	}
	this.changeFond = function(fond){
		console.log('--changeFond')
		console.log(fond+' ' +this.currentFond)
		if(fond && fond != this.currentFond){
			$('#fonds .fond.active').removeClass('active')
			$('#fonds .fond.'+fond).addClass('active')
			this.currentFond = fond;
		}
	}
	this.changePage = function(page){
		console.log("--changePage")
		if(page != this.currentPage){
			var virtual = this.arborescence[page].virtual
			var onUnloadFunction = self.arborescence[this.currentPage].onunload
			if(onUnloadFunction){
				window[onUnloadFunction]()
			}
			if(!virtual){
				$('#pages .template.active').removeClass('active')
				var template = this.arborescence[page].template
				if(template){
					if(!$('#pages .template[data-page='+page+']').length){	
						console.log("la page n'existe pas, il faut la charger")
						var datas = self.arborescence[page].datas
						if(datas){
							oDatas.pushDatasToTemplate(datas, template)
						}
					}
					setTimeout(function(){
						console.log('add class active to page')
						console.log($('#pages .template[data-page='+page+']'))
						$('#pages .template[data-page='+page+']').addClass('active')
						var onLoadFunction = self.arborescence[page].onload
						if(onLoadFunction){
							window[onLoadFunction]()
						}
					}, 700)
				}else{
					console.log("error: le template n'existe pas")
				}
			}
			if(this.arborescence[page].disablemenu){
				$(menu).addClass('disabled').removeClass('isniveau1 isniveau2')
				$('header#header .menuLink').removeClass('active')
			}else{
				$(menu).removeClass('disabled')
				this.refreshMenu(page, virtual)
			}
			this.currentPage = page
		}
	}
	this.refreshMenu = function(page, virtual){
		console.log("--refreshMenu")
		var niveau = this.arborescence[page].niveau
		var angle = this.arborescence[page].angle
		var reversemenu = this.arborescence[page].reversemenu
		console.log(niveau)
		console.log(angle)
		console.log(reversemenu)
		if(niveau == 2){
			$(menu).addClass('isniveau1 isniveau2')
			this.loadMenu(this.arborescence[page].parent)
			setTimeout(function(){
				$('.niveau2', menu).css('-webkit-transform', 'scale(1) rotate('+angle+'deg)')
			},100)
		}else if(niveau == 1){
			$('.niveau2', menu).css('-webkit-transform', 'scale(0) rotate(0deg)')
			$(menu).addClass('isniveau1').removeClass('isniveau2')
			$('.niveau1', menu).css('-webkit-transform', 'scale(1) rotate('+angle+'deg)')
		}else if(niveau == 0){
			$('.niveau2, .niveau1', menu).css('-webkit-transform', 'scale(0) rotate(0deg)')
			$(menu).removeClass('isniveau1 isniveau2')
		}else{
			$('.niveau2, .niveau1', menu).css('-webkit-transform', 'scale(0) rotate(0deg)')
			$(menu).removeClass('isniveau1 isniveau2 hide')
			$('header#header .menuLink').removeClass('active')
		}
		if(reversemenu){
			$(menu).addClass('reversed')
			$('#log').append('<br>add reversed class')
		}else{
			$(menu).removeClass('reversed')
			$('#log').append('<br>remove reversed class')
		}
		if(virtual){
			this.loadMenu(page)
		}else if(page != 'home'){
			setTimeout(function(){
				self.hideMenu()
			},300)
		}
	}
	this.loadMenu = function(page){
		console.log('--loadMenu')
		var menuName = this.arborescence[page].menu
		var niveau = this.arborescence[page].niveau+1
		console.log(menuName+' '+niveau)
		if(self.currentMenus[niveau-1] != menuName){
			$.ajax({
				url: 'configs/menus/'+menuName+'.html',
				success: function(data){
					setTimeout(function(){
						var sousmenu = $(data).find('g.niveau'+niveau)
						$('.niveau'+niveau, menu).replaceWith(sousmenu)
						self.niveau1and2Events()
						$(menu).addClass('isniveau'+niveau)
						$('.niveau'+niveau, menu).css('-webkit-transform', 'scale(0) rotate(0deg)')
						setTimeout(function(){
							$('.niveau'+niveau, menu).css('-webkit-transform', 'scale(1) rotate(0deg)')
						},10)
						self.currentMenus[niveau-1] = menuName
						console.log(self.currentMenus)
					},10)
				}
			});
		}else{
			$(menu).addClass('isniveau'+niveau)
			// setTimeout(function(){
			$('.niveau'+niveau, menu).css('-webkit-transform', 'scale(1) rotate(0deg)')
			// },30)
		}
	}
	// this.getPagesByParent = function(parent){
	// 	console.log(parent)
	// 	var niveau = this.arborescence[parent].niveau+1
	// 	if(currentMenuLinks[niveau] != parent){
	// 		console.log("--getPagesByParent")
	// 		var pages = new Array;
	// 		var index = 1
	// 		$.each(this.arborescence, function(page, data){
	// 			if(data.parent == parent){
	// 				console.log("page enfant trouvée")
	// 				console.log(page)
	// 				$('.niveau'+niveau+' .linkZone.item'+index, self.menu).attr('data-page', page).text(page)
	// 				index++
	// 			}
	// 		})
	// 		currentMenuLinks[niveau] = parent
	// 		console.log(currentMenuLinks)
	// 	}
	// 	$(menu).addClass('isniveau'+niveau)
	// }
	this.showMenu = function(){
		$(menu).removeClass('hide')
		menuIsHide = false
		oSound.play('panieropen')
		$('header#header .menuLink').removeClass('active')
	}
	this.hideMenu = function(){
		if($(menu).hasClass('isniveau1') || $(menu).hasClass('isniveau2')){
			$(menu).addClass('hide')
			menuIsHide = true
			oSound.play('panieropen')
			$('header#header .menuLink').addClass('active')
		}
	}

	this.construct()
	this.loadArborescence()
	this.defaultEvents()
	this.niveau1and2Events()
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
	oDatas = new datas()

	$('#pages .gdfsuez .slide3 .marker').hammer().on('tap', function(){
		$(this).toggleClass('active').siblings().removeClass('active')
	})
	$('#pages .gulf-presence .marker, .template.gulf-presence .zoomqatar').hammer().on('tap', function(){
		var pays = $(this).attr('data-pays')
		oNavigation.navTo("pays-"+pays)
	})

	$('#pages .city-of-tomorrow .marker').hammer().on('tap', function(){
		var id = $(this).attr('data-popin')
		var popin = $('#pages .city-of-tomorrow .popin'+id)
		var height = popin.height()
		var margintop = - height / 2 - 60
		popin.css('margin-top', margintop).addClass('active').siblings().removeClass('active')
	})
	$('#pages .city-of-tomorrow .popin').hammer().on('tap', function(){
		$(this).removeClass('active')
	})
	$('#pages .activities .marker').hammer().on('tap', function(){
		var page = $(this).attr('data-page')
		oNavigation.navTo(page)
	})
	$('#pages .capabilities .marker').hammer().on('tap', function(){
		var page = $(this).attr('data-page')
		oNavigation.navTo(page, 'capabilities', "< Back to Capabilities")
	})
}

var datas = function(){
	var self = this
	var loadedDatas

	this.loadDatas = function(){
		console.log('--loadDatas')
		$.ajax({
			dataType: "json",
			url: 'configs/data.json',
			success: function(data){
				console.log('success load datas')
				// console.log(data)
				self.loadedDatas = data
			}
		});
	}
	this.pushDatasToTemplate = function(page, template){
		console.log("--pushDatasToTemplate")
		console.log(page)
		console.log(this.loadedDatas)
		console.log(this.loadedDatas[page])
		var view = $('#templates .template.'+template).html()
		var output = Mustache.render(view, this.loadedDatas[page])
		var page = $('<div class="template '+template+'" data-page="'+page+'"></div>').html(output).appendTo('#pages')
	}

	this.loadDatas()
}

var oGdfsuezSlider = null
function onLoadGdfsuez(){
	if(!oGdfsuezSlider)	oGdfsuezSlider = new gdfsuezSlider()
	oGdfsuezSlider.next()
}
function onUnloadGdfsuez(){
	oGdfsuezSlider.hide()
}
var gdfsuezSlider = function(){
	var self = this
	var page
	var currentSlide
	var nbSlides

	this.app = function(){
		page = $('#pages .gdfsuez')
		currentSlide = 0

		nbSlides = $('.slide', page).length

		$(page).hammer().off('swipeleft swiperight').on('swipeleft', function(){
			console.log('next')
			self.next()
		}).on('swiperight', function(){
			console.log('prev')
			self.prev()
		})
	}
	this.next = function(){
		if(currentSlide < nbSlides){
			$('.slide.slide'+currentSlide, page).addClass('prev')
			currentSlide++
			$('.slide.slide'+currentSlide, page).removeClass('next')
			self.pagination()
		}
	}
	this.prev = function(){
		if(currentSlide > 1){
			$('.slide.slide'+currentSlide, page).addClass('next')
			currentSlide--
			$('.slide.slide'+currentSlide, page).removeClass('prev')
			self.pagination()
		}
	}
	this.pagination = function(){
		var numero = currentSlide < 10 ? "0"+currentSlide : currentSlide
		$('.pagination', page).html('<span>'+numero+'/</span>'+nbSlides)
	}
	this.hide = function(){
		$('.slide', page).removeClass('prev').addClass('next')
		currentSlide = 0
	}

	this.app()
}
function onLoadPays(){
	console.log('--onLoadPays')
	$('#pages .pays .reference').hammer().off('tap').on('tap', function(){
		var page = $(this).attr('data-page')
		oNavigation.navTo(page, oNavigation.currentPage, "< Back to State")
	})
}
function onLoadInfographics(){
	console.log('--onLoadInfographics')
	$('#pages .infographics .marker').hammer().off('tap').on('tap', function(){
		var page = $(this).attr('data-page')
		oNavigation.navTo(page, oNavigation.currentPage, "< Back to Infographics")
	})
}
function onLoadTechnologies(){
	console.log('--onLoadTechnologies')
	$('#pages .technologies1 .marker, #pages .technologies2 .marker, #pages .technologies3 .marker, #pages .technologies4 .marker').hammer().off('tap').on('tap', function(){
		var page = $(this).attr('data-page')
		oNavigation.navTo(page, oNavigation.currentPage, "< Back to Technologies")
	})
}
function onLoadReference(){
	$('#pages .reference .photos .photo').hammer().off('tap').on('tap', function(){
		$(this).toggleClass('active')
	})
}
function onLoadVideo(){
	console.log('--onLoadVideo')
	$('#pages .video video').hammer().off('tap').on('tap', function(){
		if($(this).get(0).paused){
			$(this).get(0).play()
			$(this).next('.play').removeClass('active')
		}else{
			$(this).get(0).pause()
			$(this).next('.play').addClass('active')
		}
	})
}
function onUnloadVideo(){
	console.log('--onUnloadVideo')
	$('#pages .video video').get(0).pause()
	$('#pages .video .play').addClass('active')
}