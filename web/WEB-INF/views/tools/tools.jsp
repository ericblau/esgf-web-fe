<%@ include file="/WEB-INF/views/common/include.jsp" %>

<ti:insertDefinition name="main-layout" >

    <ti:putAttribute name="extrastyle">
        <link rel="stylesheet" href='<c:url value="/styles/security.css" />' type="text/css">
    </ti:putAttribute>


    <ti:putAttribute name="main">
		<div class="span-18 prepend-3 last">
		
		<p/><h1>Analysis and Visualization Tools</h1>
		
		The following applications and tools are integrated with the Earth System Grid Federation infrastructure, and can be used to analyze and visualize
		the data:
		
		<p/>
		<p/>
			<a href='http://esg.llnl.gov/cdat/' ><b>CDAT (Climate Data Analysis Tools)</b></a>
			<br/>An open source, python-based framework of client-side tools, 
			     including a GUI front-end, for retrieval, analysis and visualization of Earth System data.
			                              		
		<p/>
			<a href='http://ferret.pmel.noaa.gov/LAS' ><b>LAS (Live Access Server)</b></a>
			<br/>A server-side engine that allows data reduction, visualization and comparison from a set of distributed ESGF nodes,
			and retrieval of the data product to the user desktop.
			
		<p/>
			<a href='http://cdx.jpl.nasa.gov/' ><b>CDX (Climate Data Exchange)</b></a>
			<br/>A python-based client-side toolkit and server-side gateway components that allow the user to interact with remote ESGF holdings
			as if they were local to his/her machine.
		
		</div>
	</ti:putAttribute>

</ti:insertDefinition>