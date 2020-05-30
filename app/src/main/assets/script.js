/*****************************************************************************************
    This is our main data structure, there are 4 different sections in this part of the quiz,

    @variable subdomains is an array of htmlxml content objects
    @variable triggeredSubdomains is an array that holds the subdomains that show signs of impairmant
    @variable answerMap is a map that has key subdomain name and object is an array of integers
                These integers correspond to the index that is selected by the user

*****************************************************************************************/
class Section{
	constructor(subdomains){
		this.subdomains = subdomains;
		this.triggeredSubdomains = [];
		this.answerMap = new Map();
	}
	//answerMap is a map with key being subdomain name ex: "MEMORY"
	//and object being an array of the answers each subdomain

	setAnswerMapKey(key){
		if(!this.answerMap.has(String(key))){
			var answer = [];
			this.answerMap.set(String(key), answer);	
		}
	}
	addAnswerToAnswerMap(key, answer, index){
		this.answerMap.get(String(key)).splice(index, 1, answer);
	}
	getAnswerMap(key){
		return this.answerMap.get(String(key));
	}
	getAnswerFromAnswerMap(key, index){
		return this.answerMap.get(String(key))[index];
	}
    removeSubdomain(subdomainTitle){
        var i = 0;
        for(i = 0; i < this.subdomains.length; ++i){
            if(this.subdomains[i].getAttribute('title') == subdomainTitle){
                this.subdomains[i].parentNode.removeChild(this.subdomains[i]);
                console.log(this.subdomains);
                break;
            }
        }
    }
	addTrigger(trigSub){
		if(!this.triggeredSubdomains.includes(trigSub)){
			this.triggeredSubdomains.push(trigSub);
		}
	}
	removeTrigger(trigSub){
		if(this.triggeredSubdomains.includes(trigSub)){
			this.triggeredSubdomains.splice( this.triggeredSubdomains.indexOf(trigSub), 1);
		}
	}
	containsThisSubdomain(subdomain){
		return this.answerMap.has(String(subdomain));
	}
}

/*****************************************************************************************
	GLOBAL VARIABLES
	MapOfSections is a map with key section name and object is a section object
	Section object holds the subdomain and an array of triggered subdomains
	
	currentSubdomain will also hold the current index of the subdomain we're at, for holding/keeping track
	of the "page" we're on since we will be dividing this up by pages

    arrayOfTitleNames is used so that we don't have to manually write the titlename that we're using

	we're going to have a binary min heap style array of the section names but its not
	the way we were taught, tehe logic is going to go like the book says, so we just have to
	keep track of the indices
	Section A Part 1, Section A Part 2, Section B Part 1, Section B Part 2 
	Start at 0, if all are green go to index 2, else go to index 1
	at index 2 if all are green, stop assessment, if any are yellow go to index 3
	at index 1 if all are green stop assesment, else go to full assesment
	at index 3, if all are gren, stop assesment, else go to full assesment section
    GREEN		#23b24b		rgb(35,178,75)
    ORANGE 		#f5871f		rgb(245,135,31)	
    YELLOW		#fff101		rgb(255,241,1)
    BLUE		#01336a		rgb(1,51,106)	
*****************************************************************************************/
var MapOfSections = new Map();
var currentSubdomain = 0;
var arrayOfTitleNames = [];
var currentSectionIndex = 0;
var currentQuestionIndex = 0;

const GREEN = "rgb(35, 178, 75)"; 
const ORANGE = "rgb(245, 135, 31)";
const YELLOW = "rgb(255, 241, 1)";
const BLUE = "rgb(1, 51, 106)";


function start(){
	loadXMLDoc();


	document.getElementById("nextQuestionButton").onclick = function(){
        var titleName = document.getElementById('section').innerHTML;
        var thisSectionObject = MapOfSections.get(titleName);
        var thisSectionHTMLCollection = thisSectionObject.subdomains[currentSubdomain];
        var subdomainTitle = thisSectionHTMLCollection.getAttribute('title');
        nextQuestion(titleName, thisSectionObject, thisSectionHTMLCollection, subdomainTitle);
    }

    document.getElementById('goBackButton').onclick = function() {
        var title =	document.getElementById('section').innerHTML;
        var thisSectionObject = MapOfSections.get(title);
        console.log(thisSectionObject);
        var thisSubdomainName = thisSectionObject.subdomains[currentSubdomain].getAttribute('title');

        previousQuestion(title, thisSectionObject, thisSubdomainName);
    }
//$
    document.getElementById('nextSectionButton').onclick = function() {
        var arrayOfTriggeredSubdomains = document.getElementById("triggeredSubdomains").attr('trigsub');
        if(arrayOfTriggeredSubdomains === "")
            arrayOfTriggeredSubdomains = [];
        else
            arrayOfTriggeredSubdomains = arrayOfTriggeredSubdomains.split(",");
        nextSection(arrayOfTriggeredSubdomains);

    }

    document.getElementById('previousSectionButton').onclick = function() {

        console.log(currentSubdomain);
        console.log(currentQuestionIndex);
        var title =	document.getElementById('section').innerHTML;
        var thisSectionObject = MapOfSections.get(title);
        if(currentSectionIndex == 0 || currentSectionIndex == 2){
            --currentSubdomain;
            currentQuestionIndex = 0;
        }
        else{
            if(currentSubdomain == thisSectionObject.subdomains.length && currentQuestionIndex == 0){
                --currentSubdomain;
                currentQuestionIndex = (thisSectionObject.subdomains[currentSubdomain].childElementCount - 1);
            }
        }

        clearBoxes();
        hideBottomDisplayTop();
        displaySection(arrayOfTitleNames[currentSectionIndex]);
        fillOldBoxes(arrayOfTitleNames[currentSectionIndex]);
        //displayBackButton();
        document.getElementById("nextSectionButton").style.display = "inline-block"
    }

    document.getElementById('sectionBreadcrumb').onclick = function() {
        console.log("gonna have to display a warning");
        var currentIndex = parseInt( document.getElementById("sectionBreadcrumb").attr("currentIndex") , 10);
        console.log(currentIndex);
        var t = event.srcElement;

        var sectionClicked = t.getAttribute('fulltitlename');
        var index = getTheIndex(sectionClicked);
        var breadcrumbIndex = getTheBreadcrumbIndex(sectionClicked);
        currentSectionIndex = index;

        currentSubdomain = 0;
        currentQuestionIndex = 0;
        callBreadcrumbsFunctions(arrayOfTitleNames[currentSectionIndex]);
        clearBoxes();
        displaySection(arrayOfTitleNames[currentSectionIndex]);
        fillOldBoxes(arrayOfTitleNames[currentSectionIndex]);
        //displayBackButton();
    }

}
//this is our xml request that is used to read in data from the xml file
/*****************************************************************************************
*   This function calls createLists, which will call fillMap. fillMap just reads the data
*   from the xml file and stores it in our data structures. displaySection is then 
*   called (which starts the display process)
*****************************************************************************************/

function loadXMLDoc(){

	var xmlHttpRequest;
	 if (window.XMLHttpRequest) {
        xmlHttpRequest = new XMLHttpRequest();
    } else {
        xmlHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    }

	parser = new DOMParser();
    createLists(parser.parseFromString(document.getElementById("file").innerHTML, "text/xml"));
    displaySection(arrayOfTitleNames[currentSectionIndex]);
    initializeTheSectionBreadcrumb();

}

function createLists(xml){
	xmlResponse = xml;

	fillMap(xmlResponse.getElementsByTagName('Section'));	
}

function fillMap(array){
	var i, key, tempSectionObject;
	for(i = 0; i < array.length; ++i){
		key = array[i].getAttribute('title');
		arrayOfTitleNames.push(key);
		tempSectionObject = getSectionObject(array[i]);
		MapOfSections.set(key, tempSectionObject);
	}
	console.log(arrayOfTitleNames);
}

/*****************************************************************************************
	getSectionObject is a function that gets the subdomain array from the section and 
	returns a section object with the array as the parameter for that object
	the Subdomain object will have an initial empty triggeredSubdomain
	array which is created by the constructor
	@param		an xml section which holds multiple subdomains
	@return 	an Section object containing array of subdomains and empty triggered array
******************************************************************************************/
function getSectionObject(section){
	var subDoms = section.getElementsByTagName('Subdomain');
	return new Section(subDoms);
}


/*****************************************************************************************
	displaySection displays the current section on the document and then
	calls displaySubdomains for the current subdomain
	@param subdomainTitle		The current subdomain title to be displayed
******************************************************************************************/
function displaySection(sectionTitle){
	document.getElementById('section').innerHTML = sectionTitle;

	displaySubdomain(sectionTitle);	
}

/*****************************************************************************************
    displaySubdomain is going to take a titlename of which section to display, it uses the
    titlename to get the current section object that we're at, and then use the
    current subdomain global variables to call displayQuestion
    so display subdomain will display the subdomain if we're within range of the questions
    (177) otherwise it goes to the confirmGoingToNxtSection function which 
    displays the appropriate splash page (190)
******************************************************************************************/
function displaySubdomain(sectionTitle){
	var subDomsSectionObject = MapOfSections.get(sectionTitle);
	var subDoms = subDomsSectionObject.subdomains;

	if(currentSubdomain < subDoms.length){
		/*	Use global variable currentSubdomain to get the info for the i'th subdomain  */
		var currDubName = subDoms[currentSubdomain].getAttribute('title');

        editBreadcrumb(subDomsSectionObject, currDubName, sectionTitle);
		subDomsSectionObject.setAnswerMapKey(currDubName);
		displayQuestion(subDoms[currentSubdomain]);

        if(thisQuestionWasPreviouslyAnswered(sectionTitle, subDomsSectionObject, currDubName)){ 
            displayNextButton();

        } else {

            document.getElementById("#nextQuestionButton").style.visibility = "hidden";
        }
	} else {
            confirmGoingToNextSection(subDomsSectionObject.triggeredSubdomains);
    }

    displayBackButton();


    document.getElementById(document).scrollTop(0);

}
/****************************************************************************************
    editBreacrumb edits the trail that we currently are on to change colors and to
    highlight the section we're on
    ex: memory > language > PERSONALITY         [means we're in the personality section]
        google web design breadcrumb for what a breadcrumb is
*****************************************************************************************/

function editBreadcrumb(thisSectionObject, currDubName, sectionTitle){
    var list = document.getElementById('breadcrumb');
    var totalSectionsCompleted = thisSectionObject.answerMap.size;
    var listSize = document.getElementById('breadcrumb').childNodes.length;
    var listItems = list.childNodes;
    console.log(thisSectionObject);

    resetBreadcrumb(listItems);
    if(currentSubdomain < listSize){
        listItems[currentSubdomain].childNodes[0].style.color = 'navy';
        listItems[currentSubdomain].childNodes[0].style.borderBottom = 'none';

    }
    else{
            addButtonToBreadcrumb(list, currDubName, "id", currentSubdomain);

            listItems[currentSubdomain].childNodes[0].style.color = 'navy';
            listItems[currentSubdomain].childNodes[0].style.borderBottom = 'none';
    }

}

function resetBreadcrumb(listItems){
    var i, listlen = listItems.length;
    for(i = 0; i < listlen; ++i){
        listItems[i].childNodes[0].style.color = 'grey';
    }
}
function clearBreadcrumb(){
    var list = document.getElementById('breadcrumb');
    var listSize = document.getElementById('breadcrumb').childNodes.length;
    var i;
    for(i = 0; i < listSize; ++i)
        list.removeChild(list.childNodes[0]);
}
/*****************************************************************************************
    So this function is going to take the page to a screen that displays the things that 
    have shown concern, it will have 2 buttons that will be at the bottom, 
    Under this function you will find a variety of functions that simply display
    the corresponding message and also hide the sections we no longer want to see
******************************************************************************************/
function confirmGoingToNextSection(arrayOfTriggeredSubdomains){
   //Set all of the other features to display none
    if(currentSectionIndex == 0){
        if(arrayOfTriggeredSubdomains.length == 0)
            congratulationsMoveOntoInformant(arrayOfTriggeredSubdomains);
        else
            sorryMoveOntoPatientFollowUp(arrayOfTriggeredSubdomains);
    } else if (currentSectionIndex == 1){
            congratulationsMoveOntoInformant(arrayOfTriggeredSubdomains);

    } else if (currentSectionIndex == 2){
        if(arrayOfTriggeredSubdomains.length == 0)
            congratulationsTheresNoConcerns();
        else
            sorryMoveOntoInformantFollowUp(arrayOfTriggeredSubdomains);
    
    } else if (currentSectionIndex == 3){
            congratulationsTheresNoConcerns();
    }
}

function congratulationsMoveOntoInformant(trigSubArray){
    var msg = "<b>Currently, there are " +
              " <span style=\"background-color: #23b24b\"> no indications</span>" +
              " of impairment <br><br> Would you like to continue" +
              " to the next section to confirm answers with an informant?</b> <br><br>";
    document.getElementById("message").html = msg;
    document.getElementById("triggeredSubdomains").trigsub = trigSubArray;
    hideTopDisplayBottom();
}

function sorryMoveOntoPatientFollowUp(trigSubArray){
    var msg = "<b><span style=\"background-color: #f5871f\">Indications of impairment</span>" +
//    var msg = "<b>Indications" +
              " have been exhibited in the following subdomains:<br><br>" +
//              " <span style=\"background-color: #f5871f\">";
              " <span style=\"color: #f5871f\">";
    var i, len = trigSubArray.length;
    for(i = 0; i < len; ++i){
        msg += (trigSubArray[i] + "<br>");
    }
    msg += "</span><br>";
    msg += "Would you like to continue to the in-depth patient questions?</b><br><br>"
    document.getElementById("message").html = msg;
    document.getElementById("triggeredSubdomains").trigsub = trigSubArray;
    hideTopDisplayBottom();
}
function congratulationsTheresNoConcerns(){
    var msg = "<b>There are " +
              " <span style=\"background-color: #23b24b\"> no indications</span>" +
              " of impairment <br><br> This is the end of the assesment<br>" +
              "Please return in one year to repeat assessment</b> <br><br>";
    document.getElementById("message").html = msg;
    document.getElementById("nextSectionButton").style.display = "none";
    hideTopDisplayBottom();
}
function sorryMoveOntoInformantFollowUp(trigSubArray){
    var msg = "<b><span style=\"background-color: #f5871f\">Indications of impairment</span>" +
//    var msg = "<b>Indications" +
              " have been exhibited in the following subdomains:<br><br>" +
//              " <span style=\"background-color: #f5871f\">";
              " <span style=\"color: #f5871f\">";
    var i, len = trigSubArray.length;
    for(i = 0; i < len; ++i){
        msg += (trigSubArray[i] + "<br>");
    }
    msg += "</span><br>";
    msg += "Would you like to continue to the in-depth informant questions?</b><br><br>"
    document.getElementById("message").html = msg;
    document.getElementById("triggeredSubdomains").trigsub = trigSubArray;
    hideTopDisplayBottom();
}

function hideTopDisplayBottom(){
    document.getElementById("subDobHolder").style.display = "none";
    document.getElementById("questionHolder").style.display = "none";
    //document.getElementById(".LRbutton").style.visibility = "hidden";
    document.getElementById("bottomSection").style.display = "block";
}
function hideBottomDisplayTop(){
    document.getElementById("subDobHolder").style.display = "block";
    document.getElementById("questionHolder").style.display = "grid";
    document.getElementById("bottomSection").style.display = "none";
}
/*****************************************************************************************
    function displayQuestion only displays one question at a time, displaySubdomain (which
    might have to check if there are even any quesitons to display should take care of error
    checking?
    
******************************************************************************************/
function displayQuestion(subdomain){
    var questions = subdomain.getElementsByTagName('Question');
    var i = currentQuestionIndex;
    checkForPrompts(questions[i]);
    document.getElementById("question").innerHTML = "Question: " + questions[i].getAttribute('title');
    displayAnswers(questions[i]);
    document.getElementsByClassName('questionHolder')[0].style.display = 'grid';
}

function displayNextButton(){

    var title = document.getElementById('section').innerHTML;
    var length = MapOfSections.get(title).subdomains.length;
    var lastIndex = length - 1;
    document.getElementById('nextQuestionButton').style.visibility = "visible";
}

function displayBackButton(){

    document.getElementById('goBackButton').style.visibility = "hidden";
    if(currentSectionIndex == 0 || currentSectionIndex == 2){
        if(currentSubdomain != 0 && currentSubdomain != 3){
            document.getElementById('goBackButton').style.visibility = 'visible';
        }
    } else {
        if(currentQuestionIndex == 0 && currentSubdomain != 3 && currentSubdomain != 0){
            document.getElementById('goBackButton').style.visibility = 'visible';
        } else if(currentQuestionIndex != 0 && currentSubdomain != 3){
            document.getElementById('goBackButton').style.visibility = 'visible';
        }
    }

}

/*****************************************************************************************
    checkForPrompts will check for prompts, if there are prompts it will call 
    displayPrompts function to display them
    @param question		The entire question object to be checked for containing prompts
******************************************************************************************/
function checkForPrompts(question){
    var prompt = question.getElementsByTagName('Prompt')[0];
    if(question.contains(prompt)){
        displayPrompts(question);	
    }else{
        hidePrompts();
    }
}

/*****************************************************************************************
displayPrompts will display the prompts of the current question sent to it
    @param question		The question that contains prompts
******************************************************************************************/
function displayPrompts(question){
    var prompts = question.getElementsByTagName('Prompt');
    var pName = "prompt"; 
    var thisPrompt = document.getElementById(pName);
    
    var p;
    thisPrompt.innerHTML = "<b>Prompts: </b>";
    for(p = 0; p < prompts.length; ++p){
        thisPrompt.innerHTML += (prompts[p].innerHTML + "</br>");
    }
}

function hidePrompts(){
    document.getElementById('prompt').style.display = "none";
}

/*****************************************************************************************
    function displayAnswers displays the answers for the question that is passed to it
        outer loop will cycle through each of the answers and display the 
        text for each answers:
        1)	Answer text -> using the inner loop
        2) 	Interpretation
        3) 	Referral info
        
        at the end it changes the color of the border surrounding it using 
        changeBorderColor function
    @param question		The question we are going to display answers for
******************************************************************************************/
function displayAnswers(question){
    var answers = question.getElementsByTagName('Answer');
    var ansIndex = "answer";
    var interpIndex = "interp";
    var refIndex = "ref";
    var answerBoxIndex = "answerHolder";
    var a;
    for(a = 0; a < answers.length; ++a){
        var ansName = ansIndex + a;
        var interpName = interpIndex + a;
        var refName = refIndex + a;
        var answerBoxName = answerBoxIndex + a;
        /*		Getting the answer portion of the entire answer		*/
        var anstext = answers[a].getElementsByTagName('Ans');
        var t;
        document.getElementById(ansName).innerHTML = "<b>Answer:</b>";
        for(t = 0; t < anstext.length; ++t){
            document.getElementById(ansName).innerHTML += ("</br>" + anstext[t].innerHTML);
        }
        /*		Getting the interpretation portion of the entire answer		*/
        document.getElementById(interpName).innerHTML = ("<b>Interpretation:</b></br>" + answers[a].getElementsByTagName('Interpretation')[0].innerHTML);
        
        /*		Getting the referral  portion of the entire answer		*/
        document.getElementById(refName).innerHTML = ("<b>Indications For Referral:</b></br>" + answers[a].getElementsByTagName('IndicationsForReferral')[0].innerHTML);
        
        /*		Change the box color	*/
        changeBorderColor(answerBoxName, answers[a].getElementsByTagName('Color')[0].innerHTML)

    }

}

/*****************************************************************************************
    changeBorderColor changes the color of the box sent to it?
******************************************************************************************/

function changeBorderColor(box, color){
    var col;


    switch(color){
        case 'GREEN':
            col = GREEN;
            break;
        case 'ORANGE':	
            col = ORANGE;
            break;
        case 'YELLOW':
            col = YELLOW;
            break;
    }

    document.getElementById(box).style.borderColor = col;
    document.getElementById(box).backgroundColor = '#e1e2e4';


}

/*****************************************************************************************
    selectAnswer is a function that will set the trigger for this particular question to 
    either true or false by 
    it is called by the html page (inspect an answer holder to see more details)
    @param answerIndex		0 for top answer, 1 for bottom answer
******************************************************************************************/
function selectAnswer(answerIndex){
    var answerHolder = "answerHolder" + answerIndex;
    var button = "button" + answerIndex;
    if(isButtonSelected(answerIndex) == 'false'){
        var element = document.getElementById(answerHolder);

        //Check if the other button has been selected
        var otherAnswerIndex = (answerIndex == 0 ? 1 : 0);
        if(isButtonSelected(otherAnswerIndex) == 'true'){
            resetBox(otherAnswerIndex);
        }
        
        element.style.backgroundColor = element.style.borderColor;
        document.getElementById(button).setAttribute('selected','true');
        changeBoxImageAndBorderToSelected(answerIndex, element.style.borderColor);
    
    }
    displayNextButton();
}

function changeBoxImageAndBorderToSelected(answerIndex, color){
    var src = '';
    var col;
    switch(color){
        case GREEN:
            src += 'GREEN.png';
            break;
        case ORANGE:  
            src += 'ORANGE.png';
            break;
        case YELLOW:
            src += 'YELLOW.png';
            break;
    }
//    box.css('border-color', '#0070c9');
    document.getElementById("answerHolder" + answerIndex).style.borderColor = "blue";
    document.getElementById("answerHolder" + answerIndex).style.boxShadow = '#0070c94d 5px 10px 18px';

    document.getElementById("button" + answerIndex).src = src;

}

/*****************************************************************************************
    resetBox resets the box of the indices sent to it back to its normal colors and also
    sets the selected variable back to false
******************************************************************************************/
function resetBox(answerIndex){
    var answerHolder = "answerHolder" + answerIndex;
    var button = "button" + answerIndex;
    if(document.getElementById(answerHolder).style.backgroundColor != "rgb(225, 226, 228)"){
        var border = document.getElementById(answerHolder).style.backgroundColor;
        document.getElementById(answerHolder).style.borderColor = border;
    }
    document.getElementById(answerHolder).style.backgroundColor = '#e1e2e4';
    document.getElementById(answerHolder).style.boxShadow = 'none';
    document.getElementById(button).setAttribute('selected','false');
    document.getElementById(button).setAttribute('src','empty.png');

}

/*****************************************************************************************
    isButtonSelected checks to see if the button sent is selected
    @param answerquestion		index of the answer
    @return 	true if the button has been selected, false if it hasn't
******************************************************************************************/
function isButtonSelected(answerIndex){
    var button = "button" + answerIndex;
    return document.getElementById(button).getAttribute('selected');
}

/*****************************************************************************************
    nextQuestion is the button handler, i will be trying to experiment with jquery and then
    we will see if we update the rest of the page
    
    the purpose of nextQuestion is to check if all of the questions on the current page are answered
    it gets the title from the section, gets the current questionset we're on using
    a combination of title name & current subdomain to search the MapOfSections
    after confirming, for every question we have, if any of the selections is !green
    add to the map's current section the current subdomain that we're in if it's not already
    in it
    it then increases the variable currentSubdomain, and calls displaySubdomains(titile)
    
******************************************************************************************/

/*
$(document).on('click', '#nextQuestionButton', function() {
    var titleName = document.getElementById('section').innerHTML;
    var thisSectionObject = MapOfSections.get(titleName);
    var thisSectionHTMLCollection = thisSectionObject.subdomains[currentSubdomain];
    var subdomainTitle = thisSectionHTMLCollection.getAttribute('title');
    nextQuestion(titleName, thisSectionObject, thisSectionHTMLCollection, subdomainTitle);
});
*/
/*****************************************************************************************
    We're breaking this up into 2 parts because nextQuestion is actually doing different
    things based on if we're in a part 1 or part 2 scenario
    in part1 we're answering all of the questions and based on that we track down the 
    triggerred subdomains and move ontothenextone()
    part 2 will check if    
        1) the question was answered
        2) the question is green or !green
        3) in part 2, if any of the questions are green, we move automatically to the full assesment, 
        4) otherwise if we reach the end and ALL questions were green, then claim no referral
        5) call nextSection
                         
******************************************************************************************/

function nextQuestion(titleName, thisSectionObject, thisSectionHTMLCollection, subdomainTitle){
    var questions = thisSectionHTMLCollection.getElementsByTagName('Question');
    var allQuestionsAnswered = checkIfAllQuestionsAnswered();

    if(allQuestionsAnswered){
        var isGreen = addAndRemoveSubs(thisSectionObject, titleName, subdomainTitle);
        /*if we're in the Part1 of either section, we only want to move onto the next question
         * howver, if we're in the part2 section we want to see if the answer was answered
         * green or not, otherwise we are changing the question index*/
        if(currentSectionIndex == 0 || currentSectionIndex == 2){
            onToTheNextOne(titleName);
        } else {
            if(!isGreen){
                goToFullAssesmentWarningPage();
            } else {
                ++currentQuestionIndex;
                // if currentQuestionIndex = endOfQuestions, we reset back to 0 and increase
                // the subdomain because there can be more subdomains but questions have t
                // restart back at 0; we have test for reaching the end of a subdomain in
                // displaySubdomain, so it's okay to just continue increasing currentSubdomain
                // until we reach the end
                if(currentQuestionIndex == thisSectionHTMLCollection.childElementCount){
                    currentQuestionIndex = 0;
                    ++currentSubdomain;
                }
                clearBoxes();
                displaySubdomain(titleName);
                fillOldBoxes(titleName);
            }
        }
        //displayBackButton();

    } else {
        alert('Plase ensure all of the questions are answered before moving on to the next section');
    }
}

function checkIfAllQuestionsAnswered(){
    if((isButtonSelected(0) == 'false') && (isButtonSelected(1) == 'false')){	
        return false;
    }
    return true;
}

/*****************************************************************************************
    addAndRemoveSubs adds the subdomain to the Map's triggeredSubdomain array
    if any of the questions answered are !green. This is to keep track of whether 
    or not we go to follow up questions and if so,  which subdomain's questions need to be 
    displayed in the next section
    @param titleName 			title of the current section used for searching
    @param subdomainTitle		name of the subdomain that would be added
    @param questionsLength		the # of questions we're checking the page for
    @return whether or not the sub added was green (true) or not (false)
******************************************************************************************/
function addAndRemoveSubs(thisSectionObject, titleName, subdomainTitle){
    var q = currentQuestionIndex;
    var isGreen = [];
    var selected = getSelectedIndex();
    var selectedColor = document.getElementById("answerHolder"+selected).style.backgroundColor;
    addToSectionObjectAnswersMap(thisSectionObject, subdomainTitle, selected, q);
    changeTheSelectedBreadcrumbBorderColor(selectedColor);
    if(currentSectionIndex == 1 || currentSectionIndex == 3){
        var questionNo = thisSectionObject.subdomains[currentSubdomain].childElementCount -1;
        if(currentQuestionIndex == questionNo && selectedColor == GREEN){
            removeFromTriggeredSubs(thisSectionObject, subdomainTitle);
        }
        return selectedColor == GREEN;
    }
    //This was implemented this way because of original design
    //but will be updated and optimized in the future

    if(selectedColor != GREEN){
        isGreen.push(false);
    } else {
        isGreen.push(true);
    }
    if(isGreen.includes(false)){
        addToTriggeredSubs(thisSectionObject, subdomainTitle);	
        return false;
    } else {
        removeFromTriggeredSubs(thisSectionObject, subdomainTitle);
        return true;
    }
}
function changeTheSelectedBreadcrumbBorderColor(color){
    var list = document.getElementById('breadcrumb');
    var listItems = list.childNodes;
    if(listItems.length > 0)
        listItems[currentSubdomain].childNodes[0].style.borderBottom = ('1px solid ' + color);
}

function addToSectionObjectAnswersMap(thisSectionObject, subdomain, answer, questionIndex){
    thisSectionObject.addAnswerToAnswerMap(subdomain, answer, questionIndex);
}

function getSelectedIndex(){
    if(document.getElementById("button0").getAttribute('selected') == 'true')
        return 0;
    return 1;
}

function addToTriggeredSubs(thisSectionObject, subdomain){
    thisSectionObject.addTrigger(subdomain);			
}

function removeFromTriggeredSubs(thisSectionObject, subdomain){
    thisSectionObject.removeTrigger(subdomain);			
}
function goToFullAssesmentWarningPage(){
    var msg = "<b>There are " +
              " <span style=\"background-color: #fff101\">indications</span>" +
              " of impairment <br><br> This is the end of the assesment<br>" +
              "Please proceed to the Full Assesment</b> <br><br>";
    document.getElementById("message").html = msg;
    hideTopDisplayBottom();
}

/*****************************************************************************************
    function onToTheNextOne does 2 things
    1) if the questions have already been answered in the past, it fills the page with
        the old question's answers (checking the current subdomain's answerbox)
    2) if it hasnt had answers before, it then clears the entire screen and reset
        all the boxes back
    then increases the currentSubdomain we're at and calls displaySubdomains
    @param title		titleName gets passed so we can call displaySubdomain
******************************************************************************************/
function onToTheNextOne(title){
    clearBoxes();
    ++currentSubdomain;
    displaySubdomain(title);
    fillOldBoxes(document.getElementById('section').innerHTML);
}

/*
$(document).on('click', '#goBackButton', function() {
    var title =	document.getElementById('section').innerHTML;
    var thisSectionObject = MapOfSections.get(title);		
    console.log(thisSectionObject);
    var thisSubdomainName = thisSectionObject.subdomains[currentSubdomain].getAttribute('title');

    previousQuestion(title, thisSectionObject, thisSubdomainName);
});
*/

/*****************************************************************************************
    function Previous question should do a couple of things, it should decrease
    the index of the current subdomain, and then display the boxes, then fill them 
    with the previous answers
******************************************************************************************/
function previousQuestion(titleName, thisSectionObject, thisSubdomainName){
    var questions = thisSectionObject.subdomains[currentSubdomain].getElementsByTagName('Question');
    if(thisQuestionWasPreviouslyAnswered(titleName, thisSectionObject, thisSubdomainName)){
        console.log("this question was previously answered before");
        addAndRemoveSubs(thisSectionObject, titleName, thisSubdomainName);
    } else {	
        if(checkIfAllQuestionsAnswered()){
            addAndRemoveSubs(thisSectionObject, titleName, thisSubdomainName);
        }
    }
    if(currentSectionIndex == 0 || currentSectionIndex == 2){
        takeAStepBack(titleName);
    } else {
        if(currentQuestionIndex == 0){
            //COME BACK 
            if(currentSubdomain != 0)
                --currentSubdomain;
            currentQuestionIndex = (thisSectionObject.subdomains[currentSubdomain].childElementCount - 1);
        }
        else{
            --currentQuestionIndex;
        }
        clearBoxes();
        displaySubdomain(titleName);
        fillOldBoxes(titleName);
    }
    //displayBackButton();
}

function takeAStepBack(title){
    clearBoxes();
    --currentSubdomain;
    displaySubdomain(title);	
    fillOldBoxes(title);
}
function clearBoxes(){
    for(a = 0; a < 2; ++a){
        resetBox(a);
    }
}
/*****************************************************************************************
    returns true if this question was previously answered, aka their answerArray is !empty
    else returns false
******************************************************************************************/
function thisQuestionWasPreviouslyAnswered(title, sectionObject, subdomainName){
    if(currentSectionIndex == 0 || currentSectionIndex == 2){
        return sectionObject.getAnswerMap(subdomainName).length != 0;
    } else {
    
         return (typeof sectionObject.getAnswerMap(subdomainName)[currentQuestionIndex]) == undefined;
    }

}

function fillOldBoxes(title){
    var thisSectionObject = MapOfSections.get(title);		
    console.log(thisSectionObject);
    if(currentSubdomain < thisSectionObject.subdomains.length){
        var thisSubdomainName = thisSectionObject.subdomains[currentSubdomain].getAttribute('title');
        var arrayOfAnswers = thisSectionObject.getAnswerMap(thisSubdomainName);
        if(typeof arrayOfAnswers[currentQuestionIndex] != 'undefined'){
            selectAnswer(arrayOfAnswers[currentQuestionIndex]);
        }
    }
}

/*****************************************************************************************
    we're going to have a binary min heap style array of the section names but its not
    the way we were taught, tehe logic is going to go like the book says, so we just have to
    keep track of the indices
                            0		Section A Part 1, 
                            1		Section A Part 2, 
                            2		Section B Part 1, 
                            3		Section B Part 2 
    Start at 0, if all are green go to index 2, else go to index 1
    at index 2 if all are green, stop assessment, if any are yellow go to index 3
    at index 1 if all are green stop assesment, else go to full assesment
    at index 3, if all are gren, stop assesment, else go to full assesment section
******************************************************************************************/
function nextSection(arrayOfTriggeredSubdomains){
    var continue_ = true;
    if(currentSectionIndex == 0){
        if(arrayOfTriggeredSubdomains.length == 0){
            currentSectionIndex = 2;
            //going to sectionBPart1 
        } else {
            currentSectionIndex = 1;
        }
    } else if (currentSectionIndex == 1){
        if(arrayOfTriggeredSubdomains.length == 0){
            //confirm with informant smh go to Section B Part 1
            currentSectionIndex = 2;
        } else {
            //big oof theres something wrong wrong here
            if(confirm("Confirm leaving page and going to full assesment page?")){
                document.location = '/acct-ad/fullassessment/';
            }
            else{
                continue_ = false;
            }
        }
    } else if (currentSectionIndex == 2){
        if(arrayOfTriggeredSubdomains.length == 0){
        } else {
            currentSectionIndex = 3;
        }
    } else if (currentSectionIndex == 3){
        if(arrayOfTriggeredSubdomains.length == 0){
            alert("i guess nothing's wrong with you");
        } else {
            if(confirm("Confirm leaving page and going to full assesment page?")){
                document.location = '/acct-ad/fullassessment/';
            }
            else{
                continue_ = false;
            }
        }
    }
    //without this statement, the page resets upon clicking 'cancel' when choosing to move onto the next
    //page, we want the page to just be at a standstill
    if(continue_){
        alterTheSubdomains(arrayOfTriggeredSubdomains);
        currentSubdomain = 0;
        currentQuestionIndex = 0;
        copyTriggeredSubdomains(arrayOfTriggeredSubdomains, arrayOfTitleNames[currentSectionIndex]);
        hideBottomDisplayTop();    
        callBreadcrumbsFunctions(arrayOfTitleNames[currentSectionIndex]);
        displaySection(arrayOfTitleNames[currentSectionIndex]);
        clearBoxes();
        //displayBackButton();
    }
}


/*
    If we're in the first or 3rd section we don't want to do anythin
    so we just return, else we're going to change the currentSectionIndex to 
    the one that matches the index of the arrayOfTriggeredSubdomains because
    they should be in the same order.
*/
function alterTheSubdomains(arrayOfTriggeredSubdomains){
    if(currentSectionIndex == 0 || currentSectionIndex == 2)
        return;
    else{
        var arrayOfSubdomainXML = MapOfSections.get(arrayOfTitleNames[currentSectionIndex]).subdomains;
        var arrayOfSubsToBeRemoved = [];
        console.log(arrayOfSubdomainXML);
        var i;
        var length = arrayOfSubdomainXML.length;
        for(i = 0; i < length; ++i){
            var title = arrayOfSubdomainXML[i].getAttribute('title');
            if(!arrayOfTriggeredSubdomains.includes(title)){
                arrayOfSubsToBeRemoved.push(title);
                console.log(arrayOfSubsToBeRemoved);
            }
        }
        arrayOfSubsToBeRemoved.forEach(function(title){
            MapOfSections.get(arrayOfTitleNames[currentSectionIndex]).removeSubdomain(title);
        });
    }
}

function copyTriggeredSubdomains(arrayOfTriggeredSubdomains, titleNameWereCopyingTo){
    MapOfSections.get(titleNameWereCopyingTo).triggeredSubdomains = arrayOfTriggeredSubdomains;
}

function callBreadcrumbsFunctions(sectionTitleName){
    clearBreadcrumb();
    editTheSectionBreadcrumb(sectionTitleName);
}

function initializeTheSectionBreadcrumb(){
    var breadcrumb = document.getElementById('sectionBreadcrumb');
    var trimmedName = trimName(arrayOfTitleNames[currentSectionIndex]);
    addButtonToBreadcrumb(breadcrumb, trimmedName, 'fullTitleName', arrayOfTitleNames[currentSectionIndex]);
    breadcrumb.setAttribute("currentIndex", "0");
}

function editTheSectionBreadcrumb(sectionTitleName){
    var breadcrumb = document.getElementById('sectionBreadcrumb');
    var index = parseInt(breadcrumb.getAttribute("currentIndex"), 10);
    var size = breadcrumb.childElementCount;
    var trimmedName = trimName(arrayOfTitleNames[currentSectionIndex]);
    console.log(trimmedName);
    var list = breadcrumb.children;
    //append
    if(list[index+1] == undefined){
        addButtonToBreadcrumb(breadcrumb, trimmedName, 'fullTitleName', arrayOfTitleNames[currentSectionIndex]);
        ++index; 
        breadcrumb.setAttribute('currentIndex', index);
    }
    else{
        console.log("not appending");
    }
    /*
    //replace
    else if(){
        
    }
    */
    //change? like theres multiple sections we're canceling
    
}

function addButtonToBreadcrumb(breadcrumb, buttonInnerHTML, attributeName, attributeValue){
    var newItem = document.createElement('li');
    var newButton = document.createElement('button');
    newButton.innerHTML = buttonInnerHTML;
    var att = document.createAttribute(attributeName);
    att.value = attributeValue;
    newButton.setAttributeNode(att);
    newItem.appendChild(newButton);
    breadcrumb.appendChild(newItem);
} 

function trimName(sectionTitle){
    var title = sectionTitle; 
    title = title.split(/\(|\)|\:/);
    return title[0] + title[2];
}

/*Okay for now in order to display only certain section we're going to make a function that takes the array, and based on the 
    triggerd subdomains in that specific array, we're going to display subdomain
    concerns: the pages load based on subdomain's length in the map

*/

/*
$(document).on('click', '#nextSectionButton', function() {
    var arrayOfTriggeredSubdomains = $("#triggeredSubdomains").attr("trigsub");
    if(arrayOfTriggeredSubdomains === "")
        arrayOfTriggeredSubdomains = [];
    else
        arrayOfTriggeredSubdomains = arrayOfTriggeredSubdomains.split(",");
    nextSection(arrayOfTriggeredSubdomains);

});
*/

/*
$(document).on('click', '#previousSectionButton', function() {

    console.log(currentSubdomain);
    console.log(currentQuestionIndex);
    var title =	document.getElementById('section').innerHTML;
    var thisSectionObject = MapOfSections.get(title);		
    if(currentSectionIndex == 0 || currentSectionIndex == 2){

        --currentSubdomain;
        currentQuestionIndex = 0;
    }
    else{

        if(currentSubdomain == thisSectionObject.subdomains.length && currentQuestionIndex == 0){
            --currentSubdomain;
            currentQuestionIndex = (thisSectionObject.subdomains[currentSubdomain].childElementCount - 1);
        }
    }

    clearBoxes();
    hideBottomDisplayTop();    
    displaySection(arrayOfTitleNames[currentSectionIndex]);
    fillOldBoxes(arrayOfTitleNames[currentSectionIndex]);
    //displayBackButton();
    $("#nextSectionButton").css('display', 'inline-block');
});

*/

/*
$(document).on('click', '#sectionBreadcrumb li button', function() {
    console.log("gonna have to display a warning");
    var currentIndex = parseInt( $("#sectionBreadcrumb").attr("currentIndex") , 10);
    console.log(currentIndex);
    var t = event.srcElement;

    var sectionClicked = t.getAttribute('fulltitlename');
    var index = getTheIndex(sectionClicked);
    var breadcrumbIndex = getTheBreadcrumbIndex(sectionClicked);
    currentSectionIndex = index;

    currentSubdomain = 0;
    currentQuestionIndex = 0;
    callBreadcrumbsFunctions(arrayOfTitleNames[currentSectionIndex]);
    clearBoxes();
    displaySection(arrayOfTitleNames[currentSectionIndex]);
    fillOldBoxes(arrayOfTitleNames[currentSectionIndex]);
    //displayBackButton();
});
*/
//This function returns the section index that we're going to go to
function getTheIndex(name){
    var i = 0;
    for(i = 0 ; i < arrayOfTitleNames.length; ++i){
        if(name == arrayOfTitleNames[i])
            return i;
    }
}

//This function gets the breadcrumb index of the breadcrumb we're going to?
function getTheBreadcrumbIndex(name){
    var i = 0;
    var list = document.getElementById('sectionBreadcrumb').children;
    console.log(list);
    //left off here
    for(i = 0; i < list.length; ++i){
        console.log(list[i]);
        console.log(list[i].childNodes[0].getAttribute('fulltitlename'));
        if(list[i].childNodes[0].getAttribute('fulltitlename') == name){
            console.log('going to breadcrumb index ' + i);
        }

    }
}
