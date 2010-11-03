/**
 * On request mapping:
 *  
 * 	   url rewrite filter will take over first, then we do regular Spring mapping.
 * 	   RedirectView is discouraged here as it will mess up the current rewrite  
 *     rule, use "redirect:" prefix instead, and it is regarded as a better alternative
 *     anyway.    
 *     
 * For any redirect trouble, please refers to ROOT/urlrewrite.xml
 *
 * --- notes by fwang2@ornl.gov
 * 
 */
package org.esgf.web;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import org.apache.log4j.*;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.servlet.ModelAndView;
import esg.search.query.api.FacetProfile;
import esg.search.query.api.SearchOutput;
import esg.search.query.api.SearchService;
import esg.search.query.impl.solr.SearchInputImpl;


import esg.search.core.Record;
import java.util.List;

import org.apache.lucene.spatial.geometry.DistanceUnits;
import org.apache.lucene.spatial.geometry.LatLng;
import org.apache.lucene.spatial.geometry.FloatLatLng;
import org.apache.lucene.spatial.geometry.shape.LLRect;
import org.apache.lucene.spatial.tier.DistanceUtils;

@Controller
@RequestMapping(value="/search")

public class SearchController {
	
	private final SearchService searchService;
	private final FacetProfile facetProfile;
	
	private final static String SEARCH_INPUT = "search_input";
	private final static String SEARCH_OUTPUT = "search_output";
	private final static String FACET_PROFILE = "facet_profile";
	private final static String ERROR_MESSAGE = "error_message";
	private final static String SEARCH_MODEL = "search_model";
		
    private final static Logger LOG = Logger.getLogger(SearchController.class);
    
	/**
	 * List of invalid text characters - 
	 * anything that is not within square brackets.
	 */
	private static Pattern pattern = 
		Pattern.compile(".*[^a-zA-Z0-9_\\-\\.\\@\\'\\:\\;\\,\\s/()].*");
	
	public SearchController(final SearchService searchService, 
			final FacetProfile facetProfile) {
		this.searchService = searchService;
		this.facetProfile = facetProfile;
	}
	
	/**
	 * Refactored Geo Contraints
	 * 
	 */
	
	private void addGeoConstraints(final HttpServletRequest request,
			final SearchInputImpl input) {
		String [] geovars = {"west_degrees", "east_degrees",
				"south_degrees", "north_degrees"};
		for (final String geovar: geovars) {
			if (request.getParameterValues(geovar) !=null ) {
				String [] parValues = request.getParameterValues(geovar);
				for (final String parValue: parValues) {
					if (StringUtils.hasText(parValue)) {
						String geoConstraint = "";
						if(parValue.equals("south_degrees") || parValue.equals("west_degrees"))
							   geoConstraint = "[ " + parValue + " TO * ]";
							else
							   geoConstraint =  "[ * TO " +  parValue + "]";
						input.addGeospatialRangeConstraint(geovar, geoConstraint);
					}
				}
			}
		}
	}
	
	
	
	/**
	 * Method used to execute non-standard biding of search constraints.
	 * This method is invoked before the GET/POST request handler and 
	 * before HTTP parameters binding.
	 * 
	 * @param request
	 * @return
	 */
	@ModelAttribute(SEARCH_INPUT)
	public SearchInputImpl formBackingObject(final HttpServletRequest request) {
		
		// instantiate command object
		final SearchInputImpl input = new SearchInputImpl();
		

		// addGeoConstraints(request, input);
        if(request.getParameterValues("west_degrees")!=null)
        {
                String [] parValues = request.getParameterValues("west_degrees");
                for (final String parValue : parValues) {
                        if (StringUtils.hasText(parValue)) {
                                String geoConstraint = "[ " + parValue + " TO * ]";
                                input.addGeospatialRangeConstraint("west_degrees",geoConstraint);
                        }
                }
        }
        
        if(request.getParameterValues("east_degrees")!=null)
        {
                //System.out.println(request.getParameterValues("west_degrees").toString() + "\n");
                String [] parValues = request.getParameterValues("east_degrees");
                for (final String parValue : parValues) {
                        if (StringUtils.hasText(parValue)) {
                                String geoConstraint = "[ * TO " + parValue + "]";
                                input.addGeospatialRangeConstraint("east_degrees",geoConstraint);
                                
                        }
                }
        }
        
        if(request.getParameterValues("south_degrees")!=null)
        {
                //System.out.println(request.getParameterValues("west_degrees").toString() + "\n");
                String [] parValues = request.getParameterValues("south_degrees");
                for (final String parValue : parValues) {
                        if (StringUtils.hasText(parValue)) {
                                String geoConstraint = "[ " + parValue + " TO * ]";
                                input.addGeospatialRangeConstraint("south_degrees",geoConstraint);
                                
                        }
                }
        }
        
        
        if(request.getParameterValues("north_degrees")!=null)
        {
                //System.out.println(request.getParameterValues("west_degrees").toString() + "\n");
                String [] parValues = request.getParameterValues("north_degrees");
                for (final String parValue : parValues) {
                        if (StringUtils.hasText(parValue)) {
                                String geoConstraint = "[ * TO " + parValue + "]";
                                input.addGeospatialRangeConstraint("north_degrees",geoConstraint);
                        }
                }
        }
		
		// security note: loop ONLY over parameters in facet profile
		for (final String parName : facetProfile.getTopLevelFacets().keySet()) {
			final String[] parValues = request.getParameterValues(parName);
			if (parValues!=null) {
				for (final String parValue : parValues) {
					if (StringUtils.hasText(parValue)) {
						input.addConstraint(parName, parValue);
						if (LOG.isTraceEnabled()) 
							LOG.trace("formBackingObject: set constraint name=" +
									parName+" value="+parValue);
					}
				}
			}
			
		}
		
		
		
		return input;
		
	}

	/**
	 * Return search results as partial view
	 */
	@RequestMapping(value="/results", method=RequestMethod.GET)
	public String doSearchResults(	
			final HttpServletRequest request,
			Model model,
			final @ModelAttribute(SEARCH_INPUT) SearchInputImpl input, 
			final BindingResult result) throws Exception {

		LOG.debug("doSearchResults() called");
		
		
			
		// set retrieval of all facets in profile
		input.setFacets(new ArrayList<String>(facetProfile.getTopLevelFacets().keySet()));
	
		// execute query for results and facets
		SearchOutput output = searchService.search(input, true, true);
			
		String [] parValues = request.getParameterValues("whichGeo");
		for (final String parValue : parValues) 
		{
			//if radius is selected then further filtering is needed
			if(parValue.equals("Radius"))
			{
				SearchOutput filteredRadiusRecords = filterByRadius(request,output);
				output = filteredRadiusRecords;
				System.out.println("\n\n\nRUNNING RADIUS\n\n\n");
			}
			else
			{
				System.out.println("\n\n\nRUNNING BOUNDING BOX\n\n\n");
			}
		}
		
		
		
		
		// populate model
		model.addAttribute(SEARCH_OUTPUT, output);
		model.addAttribute(FACET_PROFILE, facetProfile);
		model.addAttribute(SEARCH_INPUT, input);
		
		return "search_results";
	}

	/**
	 * Return facets as partial view
	 */
	@RequestMapping(value="/facets", method=RequestMethod.GET)
	public String doSearchFacets(	
			final HttpServletRequest request,
			Model model,
			final @ModelAttribute(SEARCH_INPUT) SearchInputImpl input, 
			final BindingResult result) throws Exception {

		LOG.debug("doSearchFacets() called");
		
		
			
		// set retrieval of all facets in profile
		input.setFacets(new ArrayList<String>(facetProfile.getTopLevelFacets().keySet()));
	
		// execute query for results and facets
		final SearchOutput output = searchService.search(input, true, true);
			
		// populate model
		
		model.addAttribute(SEARCH_OUTPUT, output);
		model.addAttribute(FACET_PROFILE, facetProfile);
		model.addAttribute(SEARCH_INPUT, input);
		
		// save model in session
		
		return "search_facets";
	}
	
	
	
	/**
	 * Method invoked in response to a GET request:
	 * -) if invoked directly, a new set of facets is retrieved (but no results)
	 * -) if invoked in response to a POST-REDIRECT,
	 * @param request
	 * @param input
	 * @param result
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	@RequestMapping(method=RequestMethod.GET)
	public ModelAndView doGet(
			final HttpServletRequest request,
			final @ModelAttribute(SEARCH_INPUT) SearchInputImpl input, 
			final BindingResult result) throws Exception {

		Map<String,Object> model = new HashMap<String,Object>();
		
		if (request.getParameter(SEARCH_MODEL)!=null) {
			
			// retrieve model from session
			model = (Map<String,Object>)request.getSession().getAttribute(SEARCH_MODEL);
			
		} else {
			
			// set retrieval of all facets in profile
			input.setFacets(new ArrayList<String>(facetProfile.getTopLevelFacets().keySet()));
	
			// execute query for facets
			final SearchOutput output = searchService.search(input, false, true);
			
			// populate model
			model.put(SEARCH_INPUT, input);
			model.put(SEARCH_OUTPUT, output);
			model.put(FACET_PROFILE, facetProfile);
			
			// save model in session
			request.getSession().setAttribute(SEARCH_MODEL, model);			
		}

		return new ModelAndView("search", model);
	}
	
	/**
	 * Method invoked in response to a POST request: 
	 * both results and facets are retrieved.
	 * @param request
	 * @param input
	 * @param result
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(method=RequestMethod.POST)
	@SuppressWarnings("unchecked")
	protected String doPost(final HttpServletRequest request, 
			final @ModelAttribute(SEARCH_INPUT) SearchInputImpl input, 
			final BindingResult result) throws Exception {
		
		// invalid user input
		if (isNotValid(input.getText())) {					
			
			// re-use previous model (output and profile)
			final Map<String,Object> model = (Map<String,Object>)request.getSession().getAttribute(SEARCH_MODEL);
			// override search input
			model.put(SEARCH_INPUT, input);
			// add error
			model.put(ERROR_MESSAGE, "Error: invalid characters found in search text");
						
		// valid user input
		} else {
			
			
			// set retrieval of all facets in profile
			input.setFacets(new ArrayList<String>(facetProfile.getTopLevelFacets().keySet()));
	
			// execute query for results, facets
			final SearchOutput output = searchService.search(input, true, true);
			if (LOG.isTraceEnabled()) 
			{
				LOG.trace("doPost: results="+output);
			}
			
			
			// store new model in session
			final Map<String,Object> model = new HashMap<String,Object>();
			model.put(SEARCH_INPUT, input);
			model.put(SEARCH_OUTPUT, output);
			model.put(FACET_PROFILE, facetProfile);
			
			request.getSession().setAttribute(SEARCH_MODEL, model);
		
		}
		// use POST-REDIRECT-GET pattern with additional parameter "?search_model"
		//final String url = request.getRequestURL().toString();
		//return new ModelAndView(new RedirectView(url)).addObject(SEARCH_MODEL,"true");
		return "redirect:/search?search_model=true";
	}

	
	public SearchOutput filterByRadius(final HttpServletRequest request,SearchOutput output)
	{
		//find the center of the search using the lucene - right now manually find
		double centerLat = 0;
		double centerLong = 0;
		
		double eastDegreeValue = 0;
		double westDegreeValue = 0; 
		double southDegreeValue = 0; 
		double northDegreeValue = 0; 
			
		
		
		if(request.getParameterValues("east_degrees")!=null &&
		   request.getParameterValues("west_degrees")!=null &&
		   request.getParameterValues("north_degrees")!=null &&
		   request.getParameterValues("south_degrees")!=null)
		{
			String [] parValues = request.getParameterValues("east_degrees");
			
			for (final String parValue : parValues) {
				if (StringUtils.hasText(parValue)) {
					eastDegreeValue = Double.parseDouble(parValue);
				}
			}
			
			parValues = request.getParameterValues("west_degrees");
			
			for (final String parValue : parValues) {
				if (StringUtils.hasText(parValue)) {
					westDegreeValue = Double.parseDouble(parValue);
				}
			}	
			
			parValues = request.getParameterValues("north_degrees");
			
			for (final String parValue : parValues) {
				if (StringUtils.hasText(parValue)) {
					northDegreeValue = Double.parseDouble(parValue);
				}
			}
			
			parValues = request.getParameterValues("south_degrees");
			
			for (final String parValue : parValues) {
				if (StringUtils.hasText(parValue)) {
					southDegreeValue = Double.parseDouble(parValue);
				}
			}
			
			System.out.println("SD: " + southDegreeValue);
			System.out.println("ND: " + northDegreeValue);
			System.out.println("ED: " + eastDegreeValue);
			System.out.println("WD: " + westDegreeValue);
			
		}
		
		
		LatLng nePoint = new FloatLatLng(northDegreeValue,eastDegreeValue);
		LatLng swPoint = new FloatLatLng(southDegreeValue,westDegreeValue);
		
		//LatLng center = nePoint.calculateMidpoint(swPoint);
		
		LLRect boundedRect = new LLRect(swPoint,nePoint);
		
		LatLng center = boundedRect.getMidpoint();
		
		centerLat = center.getLat();
		centerLong = center.getLng();
		
		
		//find the radius
		//double radius =Math.abs(centerLat - eastDegreeValue);
		
		LatLng sePoint = new FloatLatLng(southDegreeValue,eastDegreeValue);
		LatLng midSPoint = sePoint.calculateMidpoint(swPoint);
		
		double radius = midSPoint.arcDistance(center, DistanceUnits.KILOMETERS);
		
		
		
		
		//SearchOutput filteredOutput = output;
		
		List<Record> deletedRecords = new ArrayList<Record>();
		
		
		for(int i=0;i<output.getResults().size();i++)
		{
			Record record = output.getResults().get(i);
			
			System.out.println("\nRecord: " + i);
			
			//check if it is within radius
			if(!isInRange(record,centerLat,centerLong,radius))
			//if(i % 2 == 1)
			{
				System.out.println("REMOVING RECORD: " + record.getId());
				deletedRecords.add(record);
			}
		}
		
		for(int i=0;i<deletedRecords.size();i++)
		{
			Record record = deletedRecords.get(i);
			output.removeResult(record);
		}
		
		
		return output;
	}
	
	private boolean isInRange(Record record,double centerLat,double centerLong,double radius)
	{
		boolean isInRange = true;
		
		Map<String, List<String>> fields = record.getFields();
		double record_wd = Double.parseDouble(fields.get("west_degrees").get(0));
		double record_ed = Double.parseDouble(fields.get("east_degrees").get(0));
		double record_nd = Double.parseDouble(fields.get("north_degrees").get(0));
		double record_sd = Double.parseDouble(fields.get("south_degrees").get(0));
		
		//use lucene methods here to determine if it is within range
		//note: this is an ALL INCLUSIVE search so all degrees must be within the range
		System.out.println("\nwd: " + record_wd + " sd: " + record_sd + " nd: " + record_nd + " ed: " + record_ed);
		System.out.println("centerLong: " + centerLong + " centerLat: " + centerLat);
		
		//find the distances between center and the record's extreme geospatial info
		LatLng center = new FloatLatLng(centerLat,centerLong);
		
		LatLng pointSW = new FloatLatLng(record_sd,record_wd);
		double pointSWDist = center.arcDistance(pointSW, DistanceUnits.KILOMETERS);
		LatLng pointNE = new FloatLatLng(record_nd,record_ed);
		double pointNEDist = center.arcDistance(pointNE, DistanceUnits.KILOMETERS);
		LatLng pointNW = new FloatLatLng(record_nd,record_wd);
		double pointNWDist = center.arcDistance(pointNW, DistanceUnits.KILOMETERS);
		LatLng pointSE = new FloatLatLng(record_sd,record_ed);
		double pointSEDist = center.arcDistance(pointSE, DistanceUnits.KILOMETERS);
		
		System.out.println("SWDIST: " + pointSWDist);
		System.out.println("SEDIST: " + pointSEDist);
		System.out.println("NWDIST: " + pointNWDist);
		System.out.println("NEDIST: " + pointNEDist);
		System.out.println("RAD: " + radius + "\n");
		
		//Note: Test for all extreme points (may be superfluous...revisit)
		if(pointSWDist > radius || 
		   pointSEDist > radius ||
		   pointNWDist > radius ||
		   pointNEDist > radius)
		{
			isInRange = false;
		}
		
		
		return isInRange; 
	}
	
	
	
	
	public static boolean isNotValid(final String text) {
		final Matcher matcher = pattern.matcher(text);
		return matcher.matches();
	}

}