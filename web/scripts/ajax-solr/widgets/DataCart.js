/*****************************************************************************
 * Copyright � 2011 , UT-Battelle, LLC All rights reserved
 *
 * OPEN SOURCE LICENSE
 *
 * Subject to the conditions of this License, UT-Battelle, LLC (the
 * �Licensor�) hereby grants to any person (the �Licensee�) obtaining a copy
 * of this software and associated documentation files (the "Software"), a
 * perpetual, worldwide, non-exclusive, irrevocable copyright license to use,
 * copy, modify, merge, publish, distribute, and/or sublicense copies of the
 * Software.
 *
 * 1. Redistributions of Software must retain the above open source license
 * grant, copyright and license notices, this list of conditions, and the
 * disclaimer listed below.  Changes or modifications to, or derivative works
 * of the Software must be noted with comments and the contributor and
 * organization�s name.  If the Software is protected by a proprietary
 * trademark owned by Licensor or the Department of Energy, then derivative
 * works of the Software may not be distributed using the trademark without
 * the prior written approval of the trademark owner.
 *
 * 2. Neither the names of Licensor nor the Department of Energy may be used
 * to endorse or promote products derived from this Software without their
 * specific prior written permission.
 *
 * 3. The Software, with or without modification, must include the following
 * acknowledgment:
 *
 *    "This product includes software produced by UT-Battelle, LLC under
 *    Contract No. DE-AC05-00OR22725 with the Department of Energy.�
 *
 * 4. Licensee is authorized to commercialize its derivative works of the
 * Software.  All derivative works of the Software must include paragraphs 1,
 * 2, and 3 above, and the DISCLAIMER below.
 *
 *
 * DISCLAIMER
 *
 * UT-Battelle, LLC AND THE GOVERNMENT MAKE NO REPRESENTATIONS AND DISCLAIM
 * ALL WARRANTIES, BOTH EXPRESSED AND IMPLIED.  THERE ARE NO EXPRESS OR
 * IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE,
 * OR THAT THE USE OF THE SOFTWARE WILL NOT INFRINGE ANY PATENT, COPYRIGHT,
 * TRADEMARK, OR OTHER PROPRIETARY RIGHTS, OR THAT THE SOFTWARE WILL
 * ACCOMPLISH THE INTENDED RESULTS OR THAT THE SOFTWARE OR ITS USE WILL NOT
 * RESULT IN INJURY OR DAMAGE.  The user assumes responsibility for all
 * liabilities, penalties, fines, claims, causes of action, and costs and
 * expenses, caused by, resulting from or arising out of, in whole or in part
 * the use, storage or disposal of the SOFTWARE.
 *
 *
 ******************************************************************************/

/**
 * Experimental Solr Front for ESG
 *
 * fwang2@ornl.gov
 * harneyjf@ornl.gov
 */


(function ($) {

AjaxSolr.DataCartWidget = AjaxSolr.AbstractWidget.extend({
	
	init: function() {
		//alert('distributed search init');
		
	},
	
	beforeRequest: function () {
		
		//alert('before request');
		
		//kill any live events that are associated with this widget
		$('#myTabs').die('tabsselect');
		$(".wgetAllChildren").die('click');
		$('.remove_dataset_from_datacart').die('click');


        $(this.target).html($('<img/>').attr('src', 'images/ajax-loader.gif'));
	},
	
	afterRequest: function () {
		

        $(this.target).empty();

        
		var self = this;
    
		//alert('after request');
		
		//getter
		var selected = $( "#myTabs" ).tabs( "option", "selected" );
		
		//alert('selected ' + selected);
		
		//grab all the keys from the datacart and place in an array
    	var selected_arr = ESGF.localStorage.toKeyArr('dataCart');
    	
    	
    	//empty the carts tab and append/initialize the datacart table 
    	$('#carts').empty();
    	
    	$('#carts').append('<div id="radio" style="margin-bottom:30px;display:none"><input type="radio" id="datacart_filter1" name="datacart_filter" value="all" /> Show all files <input type="radio" id="datacart_filter2" name="datacart_filter" value="filtered" /> Filter over search constraints </div>');
    	
    	if(ESGF.setting.showAllContents == 'true') {
    		$("input[id='datacart_filter2']").attr("checked","false");
    		$("input[id='datacart_filter1']").attr("checked","true");
    	} else {
    		$("input[id='datacart_filter1']").attr("checked","false");
    		$("input[id='datacart_filter2']").attr("checked","true");
    	}
    	
    	if(selected_arr.length > 0) {
    		$('div#radio').show();
    	}
    	
		
    	$('#carts').append('<table style="width:100%;table-layout: fixed"><tbody id="datasetList"></tbody></table>');
        $("#datasetList").empty();
		
		//create the template
        self.createTemplate(selected_arr);
		
		/**
	     * Event for tab selection (as of now, toggling between "Results" and "Datacart")
	     */
		$('#myTabs').live('tabsselect', function(event, ui) {
			if (ui.index == 1) {
				
				//alert('show the data cart here');
				Manager.doRequest(0);
				//$('input#datacart_filter').attr('checked','true');
			}
			
			
			
		});
		
		//event in case the radio buttons change
		$("input[name='datacart_filter']").change(	function() { 
			
				if($("input[id='datacart_filter2']").attr("checked")) { 
					ESGF.setting.showAllContents = 'false';
				} else {
					ESGF.setting.showAllContents = 'true';
				}

				Manager.doRequest(0);
				
		});
		
	    
	    /**
	     * Click event for generating the wget script
	     * Submits a form with hidden values that calls the wget proxy class that returns the 
	     * wget script as content type text/x-sh.
	     * The form is deleted upon completion.
	     */
	    $(".wgetAllChildren").live ('click', function (e){
	    	
	    	alert('wget');
	    	
	    	/*
	    	if(ESGF.setting.dataCartVersion == 'v1') {
	    		//grab the dataset id from the template
	        	var selectedItem = $.tmplItem(this);
	        	var selectedDocId = selectedItem.data.dataset_id;

	        	//begin assembling queryString
	            var queryString = 'type=create&id=' + selectedDocId;
	        	
	            
	            
	            //gather the ids and the urls for download
	        	var ids   = new Array();
	            var values = new Array();
	            
	            var dataset = self.replacePeriod(selectedDocId);
	            
	            
	            $(this).parent().parent().parent().find('tr.rows_'+ dataset).find(':checkbox:checked').each( function(index) {
                    if(this.id != selectedDocId) {
                    ids.push(this.id);
                    values.push(this.value);
                   }
	            });
	            
	            
	            //assemble parameters of the queryString
	            for(var i=0;i<ids.length;i++) {
	            	queryString += '&child_url=' + values[i] + '&child_id=' + ids[i];
	            }
	            

	            var url = '/esgf-web-fe/wgetproxy';
	            var security = 'wgetv3';
	            queryString += '&security=' + security;
	            
	            //assemble the input fields with the query string
	            var input = '';
	            jQuery.each(queryString.split('&'), function(){
	                var pair = this.split('=');
	                input+='<input type="hidden" name="'+ pair[0] +'" value="'+ pair[1] +'" />';
	            });
	            
	            //send request
	            jQuery('<form action="'+ url +'" method="post">'+input+'</form>')
	            .appendTo('body').submit().remove();
	    		
	    	}
	    	*/
	    });
	    
	    
	    /**
	     * Click event for removing datasets from the data cart
	     */
	    $('.remove_dataset_from_datacart').live ('click', function(e) {
	    	
	    	var selectedItem = $.tmplItem(this);
        	var selectedDocId = selectedItem.data.datasetId;

        	//remove the dataset from the localStorage
        	ESGF.localStorage.remove('dataCart',selectedDocId);
        	
        	Manager.doRequest(0);
        	
        	//change from remove from cart to add to cart
        	$('a#ai_select_'+ selectedDocId.replace(/\./g, "_")).html('Add To Cart');
        	
	    });
	    
	    
	    /**
	     * Event for checkbox file selection
	     */
	    $(".topLevel").live('change', function() {
	    	
	        LOG.debug("top level changed");

	        var currentValue = $(this).attr('checked');

	    	//grab the dataset id from the template
	    	var selectedItem = $.tmplItem(this);
	    	var selectedDocId = selectedItem.data.dataset_id;

	        $(this).parent().parent().parent().find('tr.rows_'+ replacePeriod(selectedDocId)).find(':checkbox').each( function(index) {
	                    $(this).attr('checked', currentValue);
	        });
			
	        
	    });
	    
	},
	
	/**
     * Create the template for the datacart
     * For now there are two ways to create the template...
     * 1) from the shards given from the registry service
     * 2) from the shards given in the solr config file
     * 
     * 1) is preferred and 2) is legacy
     * Each have been modularized
     */
    createTemplate: function(arr) {

    	var self = this;
    	
    	self.loadCartShardsFromService(arr);
    	
    	//loadCartShardsFromSolrConfig(arr);
    	
	},
	
	/**
	 * This function creates the datacart template by loading shards from the service instead of the solrconfig
	 * It is passed in the array of keys of all the datasets that have been selected
	 */
	loadCartShardsFromService: function (arr) {
		
		var self = this;

    	//get the 'q' parameter here
    	var qParam = Manager.store.get('q')['value'];
    	
    	//get the 'fq' parameter here
    	var fqParamArr = self.createFqParamArray();
		
    	// Make an ajax call to the fileDownloadTemplate controller to extract the files for each of datasets given in the array of keys //
    	 
    	
     	//only make the ajax call when there has been something added to the data cart
    	if(arr.length != 0) {
    		//setup the query string
    		var queryStr = { "id" : arr , "version" : ESGF.setting.dataCartVersion, "fq" : fqParamArr, "q" : qParam, "showAll" : ESGF.setting.showAllContents};
    		
    		//add a spinning wheel to show user that progress is being made in finding the files
    		self.addDataCartSpinWheel();

    		$.ajax({
    			url: '/esgf-web-fe/solrfileproxy',
    			global: false,
    			type: "GET",
    			data: queryStr,
    			dataType: 'json',
    			
    			//Upon success remove the spinning wheel and show the contents given by solr
    			 
    			success: function(data) {
    				
	    			self.removeDataCartSpinWheel();
	    			self.showFileContents(data); 
    			},
    			
    			//Upon an error remove the spinning wheel and give an alert 
    			 
	    		error: function() {
	    			self.removeDataCartSpinWheel();
	    			alert('There is a problem with one of your dataset selections.  Please contact your administrator.');
	    			
	    			/*
	            	//change from remove from cart to add to cart for all selected datasets
	    			for(var i=0;i<query_arr.length;i++) {
	                	$('a#ai_select_'+ arr[i].replace(/\./g, "_")).html('Add To Cart');
	    			}
					*/
				}
    		})
    		
    	}
    	
    	
    	/*
    	var file_download_template_url = ESGF.search.fileDownloadTemplateProxyUrl;

    	
    	
    	
    	 * Make an ajax call to the fileDownloadTemplate controller to extract the files for each of datasets given in the array of keys
    	 
    	//only make the ajax call when there has been something added to the data cart
    	if(arr.length != 0) {
    		var queryStr = { "id" : arr , "version" : ESGF.setting.dataCartVersion, "fq" : fqParamArr, "q" : qParam};
    		
    		//add a spinning wheel to show user that progress is being made in finding the files
    		self.addDataCartSpinWheel();

    		
    		$.ajax({
    			url: ESGF.search.fileDownloadTemplateProxyUrl,
    			global: false,
    			type: "GET",
    			data: queryStr,
    			dataType: 'json',
    			
    			 * Upon success remove the spinning wheel and show the contents given by solr
    			 
    			success: function(data) {
    				
	    			self.removeDataCartSpinWheel();
        			self.showFileContents(data);
    			},
    			
    			 * Upon an error remove the spinning wheel and give an alert 
    			 
	    		error: function() {
	    			self.removeDataCartSpinWheel();
	    			alert('There is a problem with one of your dataset selections.  Please contact your administrator.');
	    			
	            	//change from remove from cart to add to cart for all selected datasets
	    			for(var i=0;i<query_arr.length;i++) {
	                	$('a#ai_select_'+ arr[i].replace(/\./g, "_")).html('Add To Cart');
	    			}
					
				}
    		})
    	}
    	*/
    	
    	
	},
	
	createFqParamArray: function () {
		var fqParamArr = new Array();
    	
    	var fqParams = Manager.store.get('fq');
    	for(var i=0;i<fqParams.length;i++){
    		var fqParam = fqParams[i];
    		if( fqParam['value'] != 'type:Dataset') {
    			fqParamArr.push(fqParam['value']);
    		}
    		
    	}
    	
    	return fqParamArr;
	},
	
	
	loadCartShardsFromSolrConfig: function(arr) {
		//create an array of dataset id strings that have been selected for download
		var query_arr = createQueryArr(arr);

    	LOG.debug("-datasetID " + query_arr);
    	LOG.debug("-version " + ESGF.setting.dataCartVersion);
    	LOG.debug("-shards " + ESGF.search.shards);

    	//create an array consisting of ip addresses of the active shards
    	var shardsArr = createShardsArr();
    	
    	
    	//append 3 parameteters to the ajax call
    	//"id" - array of dataset ids that have been added to data cart
    	//"version" - version of the type of datacart (NOTE: THIS MAY BE TAKEN OUT)
    	//"shards" - array of ips that are the active shards in the configuration
    	var query = { "id" : query_arr , "version" : ESGF.setting.dataCartVersion, "shards" : shardsArr };
    	
    	//only make the ajax call when there has been something added to the data cart
    	if(query_arr.length != 0) {
    		//show status spinning wheel
    		addDataCartSpinWheel();
    		
        	$.ajax({
        		url: ESGF.search.fileDownloadTemplateProxyUrl,
        		global: false,
        		type: "GET",
        		data: query,
        		dataType: 'json',
        		success: function(data) {
        			$('#waitWarn').remove();
        			$('#spinner').remove();
        			//remove the status spinning wheel
        			removeDataCartSpinWheel();
        	    	
        			//show the contents of the data cart
        			showFileContentsV1(data);
        		},
    			error: function() {
    				$('#waitWarn').remove();
    				$('#spinner').remove();
    				alert('There is a problem with one of your dataset selections.  Please contact your administrator.');
        			
                	//change from remove from cart to add to cart for all selected datasets
        			for(var i=0;i<query_arr.length;i++) {
                    	$('a#ai_select_'+ query_arr[i].replace(/\./g, "_")).html('Add To Cart');
        			}
    			}
        		
        	});
        
    	}
	},
	
	
	//dynamically add spinning wheel to the datacart space
	addDataCartSpinWheel: function () {
    	//add a spin wheel to indicate that the system is processing
    	$('tbody#datasetList').after('<img id="spinner" src="images/ajax-loader.gif" />');
    	$('tbody#datasetList').after('<p id="waitWarn">Waiting for files...</p>');
    	
    },

    //dynamically remove spinning wheel to the datacart space
    removeDataCartSpinWheel: function() {
    	$('#waitWarn').remove();
		$('#spinner').remove();
    },
    
  //create an array of dataset id strings that have been selected for download
    createQueryArr: function(arr) {
    	var query_arr = new Array();
    	for(var i=0;i<arr.length;i++) {
    		query_arr.push(arr[i].doc.id);
    	}
    	return query_arr;
    },
    
    //create an array consisting of ip addresses of the active shards
    createShardsArr: function() {
    	var shardsArr = new Array();
    	for(var i=0;i<ESGF.search.shards.length;i++) {
    		var shards = ESGF.search.shards[i];
    		shardsArr.push(shards['nodeIp']);
    	}
    	return shardsArr;
    },
    
    
    showFileContents: function(data) {
    	
    	LOG.debug("Showing file contents" + data);
    	
    	
    	var self = this;
    	
    	if(data != null) {
    		
    		
    		var fileDownloadTemplate = data.doc;
    		
    		for(var i in fileDownloadTemplate) {
    			
    			if(i == 'file') {
    				var file = fileDownloadTemplate[i];
    				for(var j=0;j<file.length;j++) {
    					//alert(j + file[j].services.service[1]);
    				}
    			}
    		}
    		
    		
    		LOG.debug("Before template");
    		
    		$( "#cartTemplateStyledNew").tmpl(data.doc, {
    			
    			replacePeriods : function (word) {
                    return self.replacePeriod(word);
                },
                abbreviate : function (word) {
                    var abbreviation = word;
                    if(word.length > 50) {
                        abbreviation = word;//word.slice(0,20) + '...' + word.slice(word.length-21,word.length);
                    }
                    return abbreviation;
                },
                addOne: function(num) {
                    return (num+1);
                },
                sizeConversion : function(size) {
                    var convSize;
                    if(size == null) {
                        convSize = 'N/A';
                    } else {
                        var sizeFlt = parseFloat(size,10);
                        if(sizeFlt > 1000000000) {
                            var num = 1000000000;
                            convSize = (sizeFlt / num).toFixed(2) + ' GB';
                        } else if (sizeFlt > 1000000) {
                            var num = 1000000;
                            convSize = (sizeFlt / num).toFixed(2) + ' MB';
                        } else {
                            var num = 1000;
                            convSize = (sizeFlt / num).toFixed(2) + ' KB';
                        }
                    }
                    return convSize;
                }
            })
            .appendTo("#datasetList")
            .find( "a.showAllChildren" ).click(function() {
            	
            	if(this.innerHTML === "Expand") {
                    this.innerHTML="Collapse";
                } else {
                    this.innerHTML="Expand";
                }
            	
            	
            	var selectedItem = $.tmplItem(this);
                var selectedDoc = selectedItem;

            	var selectedDocId = selectedItem.data.datasetId;
            	
            	var id = $(this).parent().parent().parent().html();
            	
                //$('input[name=' + selectedDocId + ']').toggle();
                
                //$(this).parent().parent().parent().find('tr.rows_'+selectedDocId).toggle();
                //$('tr.rows_'+selectedDocId).toggle();
                
            	$('tr.rows_'+self.replacePeriod(selectedDocId)).toggle();
                
            	
            	
            	
            	
                /*
                var id = $(this).parent().attr("id").replace(/\./g,"_");
            	
                $('tr.rows_'+id).toggle();
                if(this.innerHTML === "Expand") {
                    this.innerHTML="Collapse";
                } else {
                    this.innerHTML="Expand";
                }
                */
                
                /*
                var selectedDocId = selectedDoc.data.dataset_id;
                $('input[name=' + selectedDocId + ']').toggle();

                var id = $(this).parent().attr("id").replace(/\./g,"_");
                $('tr.rows_'+id).toggle();
                if(this.innerHTML === "Expand") {
                    this.innerHTML="Collapse";
                } else {
                    this.innerHTML="Expand";
                }
                */
            });
    		
    		
    		/*
    		LOG.debug("Before template");
    		$( "#cartTemplateStyled").tmpl(fileDownloadTemplate, {
    			
    			replacePeriods : function (word) {
                    return self.replacePeriod(word);
                },
                abbreviate : function (word) {
                    var abbreviation = word;
                    if(word.length > 50) {
                        abbreviation = word;//word.slice(0,20) + '...' + word.slice(word.length-21,word.length);
                    }
                    return abbreviation;
                },
                addOne: function(num) {
                    return (num+1);
                },
                sizeConversion : function(size) {
                    var convSize;
                    if(size == null) {
                        convSize = 'N/A';
                    } else {
                        var sizeFlt = parseFloat(size,10);
                        if(sizeFlt > 1000000000) {
                            var num = 1000000000;
                            convSize = (sizeFlt / num).toFixed(2) + ' GB';
                        } else if (sizeFlt > 1000000) {
                            var num = 1000000;
                            convSize = (sizeFlt / num).toFixed(2) + ' MB';
                        } else {
                            var num = 1000;
                            convSize = (sizeFlt / num).toFixed(2) + ' KB';
                        }
                    }
                    return convSize;
                }
            })
            .appendTo("#datasetList")
            .find( "a.showAllChildren" ).click(function() {
            	var selectedItem = $.tmplItem(this);
                var selectedDoc = selectedItem;
               
                
                var selectedDocId = selectedDoc.data.dataset_id;
                $('input[name=' + selectedDocId + ']').toggle();

                var id = $(this).parent().attr("id").replace(/\./g,"_");
                $('tr.rows_'+id).toggle();
                if(this.innerHTML === "Expand") {
                    this.innerHTML="Collapse";
                } else {
                    this.innerHTML="Expand";
                }
                
            });
            */
    	}
		
    	
    	
	},
	
	
	
	
	
	/* Utility functions */
	
	
	 /*
     * This function is used primarily to avoid annoying errors that occur with strings that have periods in them
     */
    replacePeriod: function (word)
    {
        var newWord = word.replace(/\./g,"_");
        return newWord;
    },
	

    /*
     * This function prints contents of an object
     */
    printObject: function (object) {
        var output = '';
        for (var property in object) {
          output += property + ': ' + object[property]+'; ';
        }
        alert(output);
    },
    
    /*
     * This function abbreviates long strings
     */
    abbreviateWord: function(word) {
    	var abbreviation = word;
        if(word.length > 25) {
            abbreviation = word.slice(0,10) + '...' + word.slice(word.length-11,word.length);
        }
        return abbreviation;
    },
    
    /*
     * This function converts file sizes to a string representing its size in bytes
     */
    sizeConvert: function (size) {
    	var convSize;
        if(size == null) {
            convSize = 'N/A';
        } else {
            var sizeFlt = parseFloat(size,10);
            if(sizeFlt > 1000000000) {
                var num = 1000000000;
                convSize = (sizeFlt / num).toFixed(2) + ' GB';
            } else if (sizeFlt > 1000000) {
                var num = 1000000;
                convSize = (sizeFlt / num).toFixed(2) + ' MB';
            } else {
                var num = 1000;
                convSize = (sizeFlt / num).toFixed(2) + ' KB';
            }
        }
        return convSize;
    }
    

});

}(jQuery));



/* old mytabs */
/*
var dataCart = localStorage['dataCart'];
var selected = dataCart.split(";");
var selected_arr = [];
	for(var i=0;i<selected.length-1;i++)
	{
		alert('selected: ' + i + ' ' + selected[i]);
		selected_arr.push(selected[i]);
	}

alert('new array: ' + selected.length);
alert('this target: ' + $('#carts').html());
$('#carts').empty();
$('#carts').append('<table style="width:100%;table-layout: fixed"><tbody id="datasetList"></tbody></table>');
$("#datasetList").empty();

// selection tab
LOG.debug("Selection tab");
// convert object to array
//var arr = ESGF.util.toArray(selected);

alert('array: ' + selected_arr);

if(selected_arr != undefined) {
	if(ESGF.setting.dataCartVersion == 'v1') {
    	self.createTemplate(selected_arr);
	}
}
//add the table element
$(this.target).append('<table style="width:100%;table-layout: fixed"><tbody id="datasetList"></tbody></table>');
$("#datasetList").empty();
// selection tab
LOG.debug("Selection tab");
// convert object to array
var arr = ESGF.util.toArray(ESGF.search.selected);



//need a function that replaces periods in the name of the dataset (events in jquery cannot access elements that have these)

if(arr != null || arr != undefined || arr.length == 0 || arr != '') {
	if(ESGF.setting.dataCartVersion == 'v1') {
    	self.createTemplate(arr);
	}
}
*/



/* old live select of tabs
$('#myTabs').live('tabsselect', function(event, ui) {

	alert('did i come here?');
	
    if (ui.index == 1) {
    	
    	//grab all the keys from the datacart and place in an array
    	var selected_arr = ESGF.localStorage.toKeyArr('dataCart');
    	

    	//empty the carts tab and append/initialize the datacart table 
    	$('#carts').empty();
    	$('#carts').append('<table style="width:100%;table-layout: fixed"><tbody id="datasetList"></tbody></table>');
        $("#datasetList").empty();
        
        //create the template
        self.createTemplate(selected_arr);
    }
    
});
*/